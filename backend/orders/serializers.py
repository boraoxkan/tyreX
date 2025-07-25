# backend/orders/serializers.py
from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from decimal import Decimal, ROUND_HALF_UP
from .models import Order, OrderItem, OrderStatusHistory
from products.models import Product
from inventory.models import StockItem, Warehouse
from companies.models import Company, RetailerWholesaler


class OrderItemCreateSerializer(serializers.Serializer):
    """
    Sipariş kalemi oluşturma için serializer
    """
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    stock_item_id = serializers.IntegerField(required=False)
    
    def validate_product_id(self, value):
        """Ürünün var olduğunu kontrol et"""
        try:
            product = Product.objects.get(id=value, is_active=True)
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError(f'ID {value} ile aktif ürün bulunamadı.')
    
    def validate(self, attrs):
        """Stok kontrolü ve en iyi stok kalemi seçimi"""
        product_id = attrs['product_id']
        quantity = attrs['quantity']
        stock_item_id = attrs.get('stock_item_id')
        
        # Kullanıcının şirketi var mı?
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'company') or not request.user.company:
            raise serializers.ValidationError('Sipariş vermek için şirkete bağlı olmalısınız.')
        
        retailer = request.user.company
        
        # Belirli bir stok kalemi belirtilmişse onu kullan
        if stock_item_id:
            try:
                stock_item = StockItem.objects.select_related(
                    'product', 'warehouse', 'warehouse__company'
                ).get(
                    id=stock_item_id,
                    product_id=product_id,
                    is_active=True,
                    is_sellable=True
                )
                
                # Yeterli stok var mı?
                available = stock_item.get_available_quantity()
                if available < quantity:
                    raise serializers.ValidationError(
                        f'Yetersiz stok. Mevcut: {available}, İstenen: {quantity}'
                    )
                
                attrs['stock_item'] = stock_item
                return attrs
                
            except StockItem.DoesNotExist:
                raise serializers.ValidationError(f'ID {stock_item_id} ile stok kalemi bulunamadı.')
        
        # En iyi stok kalemini otomatik seç
        # Öncelik: Çalıştığı toptancılar > En düşük fiyat > En yüksek stok
        product = Product.objects.get(id=product_id)
        
        # Çalıştığı toptancıları al
        known_wholesaler_ids = RetailerWholesaler.objects.filter(
            retailer=retailer,
            is_active=True
        ).values_list('wholesaler_id', flat=True)
        
        # Stok kalemlerini filtrele
        stock_items = StockItem.objects.filter(
            product=product,
            is_active=True,
            is_sellable=True,
            quantity__gte=quantity,
            warehouse__is_active=True,
            warehouse__company__company_type__in=['wholesaler', 'both'],
            sale_price__isnull=False
        ).select_related('warehouse', 'warehouse__company')
        
        if not stock_items.exists():
            raise serializers.ValidationError(
                f'{product.name} için yeterli stok bulunamadı.'
            )
        
        # Önce bilinen toptancıları dene
        known_stock_items = stock_items.filter(
            warehouse__company_id__in=known_wholesaler_ids
        ).order_by('sale_price', '-quantity')
        
        if known_stock_items.exists():
            attrs['stock_item'] = known_stock_items.first()
        else:
            # Bilinen toptancı yoksa en ucuzunu seç
            attrs['stock_item'] = stock_items.order_by('sale_price', '-quantity').first()
        
        return attrs


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Sipariş kalemi detay serializer'ı
    """
    product_details = serializers.SerializerMethodField()
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    wholesaler_name = serializers.CharField(source='warehouse.company.name', read_only=True)
    calculated_discount_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_details',
            'warehouse',
            'warehouse_name',
            'wholesaler_name',
            'quantity',
            'unit_price',
            'wholesaler_reference_price',
            'total_price',
            'discount_percentage',
            'discount_amount',
            'calculated_discount_percentage',
            'product_name',
            'product_sku',
            'product_brand',
            'is_canceled',
            'canceled_at',
            'cancel_reason'
        ]
        read_only_fields = [
            'id', 'total_price', 'product_name', 'product_sku', 'product_brand',
            'is_canceled', 'canceled_at', 'cancel_reason'
        ]
    
    def get_product_details(self, obj):
        """Ürün detayları"""
        return {
            'id': obj.product.id,
            'name': obj.product.name,
            'sku': obj.product.sku,
            'brand': obj.product.brand,
            'category': obj.product.category.name if obj.product.category else None
        }
    
    def get_calculated_discount_percentage(self, obj):
        """Hesaplanan indirim yüzdesi"""
        return str(obj.get_discount_percentage_calculated())


class OrderCreateSerializer(serializers.Serializer):
    """
    Sipariş oluşturma için serializer
    """
    wholesaler_id = serializers.IntegerField()
    items = OrderItemCreateSerializer(many=True)
    delivery_address = serializers.CharField(required=False, allow_blank=True)
    delivery_contact = serializers.CharField(required=False, allow_blank=True)
    delivery_phone = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_wholesaler_id(self, value):
        """Toptancının var olduğunu kontrol et"""
        try:
            wholesaler = Company.objects.get(
                id=value,
                company_type__in=['wholesaler', 'both'],
                is_active=True
            )
            return value
        except Company.DoesNotExist:
            raise serializers.ValidationError(f'ID {value} ile aktif toptancı bulunamadı.')
    
    def validate_items(self, value):
        """Sipariş kalemlerini kontrol et"""
        if not value:
            raise serializers.ValidationError('En az bir ürün eklemelisiniz.')
        
        # Aynı ürünün birden fazla kez eklenmemesini kontrol et
        product_ids = [item['product_id'] for item in value]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError('Aynı ürün birden fazla kez eklenemez.')
        
        return value
    
    def validate(self, attrs):
        """Genel validasyon - tüm ürünlerin aynı toptancıdan olmasını kontrol et"""
        wholesaler_id = attrs['wholesaler_id']
        
        # Her bir item için stok kontrolü ve fiyat hesaplama
        validated_items = []
        for item_data in attrs['items']:
            item_serializer = OrderItemCreateSerializer(
                data=item_data,
                context=self.context
            )
            item_serializer.is_valid(raise_exception=True)
            
            stock_item = item_serializer.validated_data['stock_item']
            
            # Stok kaleminin belirtilen toptancıya ait olduğunu kontrol et
            if stock_item.warehouse.company_id != wholesaler_id:
                raise serializers.ValidationError(
                    f'{stock_item.product.name} ürünü belirtilen toptancıda mevcut değil.'
                )
            
            validated_items.append({
                **item_serializer.validated_data,
                'stock_item': stock_item
            })
        
        attrs['validated_items'] = validated_items
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        """
        Sipariş ve sipariş kalemlerini oluşturur
        """
        request = self.context['request']
        retailer = request.user.company
        retailer_user = request.user
        
        # Abonelik ve commission bilgilerini al
        try:
            subscription = retailer.subscription
            tyrex_commission_rate = subscription.plan.get_tyrex_commission_decimal() * 100
        except:
            tyrex_commission_rate = Decimal('2.50')  # Varsayılan
        
        # Toptancı ve ilişki bilgilerini al
        wholesaler = Company.objects.get(id=validated_data['wholesaler_id'])
        
        try:
            retailer_wholesaler = RetailerWholesaler.objects.get(
                retailer=retailer,
                wholesaler=wholesaler,
                is_active=True
            )
            payment_terms_days = retailer_wholesaler.payment_terms_days
        except RetailerWholesaler.DoesNotExist:
            payment_terms_days = 30  # Varsayılan
        
        # Sipariş toplamını hesapla
        subtotal = Decimal('0.00')
        validated_items = validated_data['validated_items']
        
        for item in validated_items:
            stock_item = item['stock_item']
            quantity = item['quantity']
            
            # Dinamik fiyat hesaplama (market serializer'dan)
            base_price = stock_item.sale_price
            
            # Toptancı iskontosunu hesapla
            try:
                relationship = RetailerWholesaler.objects.get(
                    retailer=retailer,
                    wholesaler=wholesaler,
                    is_active=True
                )
                
                # Kredi limitine göre iskonto hesapla
                if relationship.credit_limit:
                    if relationship.credit_limit >= 100000:
                        discount_rate = Decimal('0.05')  # %5 iskonto
                    elif relationship.credit_limit >= 50000:
                        discount_rate = Decimal('0.03')  # %3 iskonto
                    else:
                        discount_rate = Decimal('0.01')  # %1 iskonto
                else:
                    discount_rate = Decimal('0.02')  # Varsayılan %2 iskonto
            except RetailerWholesaler.DoesNotExist:
                discount_rate = Decimal('0.00')  # İlişki yoksa iskonto yok
            
            # Final fiyat hesaplama
            discounted_price = base_price * (Decimal('1') - discount_rate)
            final_price = discounted_price * (Decimal('1') + (tyrex_commission_rate / 100))
            
            item['unit_price'] = final_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            item['wholesaler_reference_price'] = base_price
            
            subtotal += item['unit_price'] * quantity
        
        # Sipariş oluştur
        order = Order.objects.create(
            retailer=retailer,
            wholesaler=wholesaler,
            retailer_user=retailer_user,
            status='pending',
            payment_status='pending',
            subtotal=subtotal,
            total_amount=subtotal,  # Şimdilik basit, sonra tax vs eklenebilir
            currency='TRY',
            tyrex_commission_rate=tyrex_commission_rate,
            payment_terms_days=payment_terms_days,
            delivery_address=validated_data.get('delivery_address', ''),
            delivery_contact=validated_data.get('delivery_contact', ''),
            delivery_phone=validated_data.get('delivery_phone', ''),
            notes=validated_data.get('notes', ''),
            order_date=timezone.now()  # Explicit olarak set et
        )
        
        # Sipariş kalemlerini oluştur ve stokları güncelle
        order_items = []
        for item in validated_items:
            stock_item = item['stock_item']
            quantity = item['quantity']
            
            # Stok miktarını düşür
            stock_item.quantity -= quantity
            stock_item.save(update_fields=['quantity'])
            
            # Sipariş kalemini oluştur
            order_item = OrderItem.objects.create(
                order=order,
                product=stock_item.product,
                warehouse=stock_item.warehouse,
                stock_item=stock_item,
                quantity=quantity,
                unit_price=item['unit_price'],
                wholesaler_reference_price=item['wholesaler_reference_price']
            )
            order_items.append(order_item)
        
        # Durum geçmişi kaydı
        OrderStatusHistory.objects.create(
            order=order,
            old_status=None,
            new_status='pending',
            changed_by=retailer_user,
            change_reason='Sipariş oluşturuldu',
            notes=f'Toplam {len(order_items)} kalem, {order.get_total_items()} adet ürün'
        )
        
        # Celery görevi tetikle (asenkron toptancı bildirimi)
        try:
            from .tasks import send_order_to_wholesaler
            send_order_to_wholesaler.delay(order.id)
        except ImportError:
            # Celery yoksa skip et
            import logging
            logger = logging.getLogger(__name__)
            logger.warning("Celery not available, skipping order notification task")
        except Exception as e:
            # Diğer hatalar
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to trigger order notification task: {e}")
        
        return order


class OrderSerializer(serializers.ModelSerializer):
    """
    Sipariş detay serializer'ı
    """
    retailer_name = serializers.CharField(source='retailer.name', read_only=True)
    wholesaler_name = serializers.CharField(source='wholesaler.company.name', read_only=True)
    retailer_user_name = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    total_unique_products = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    can_be_canceled = serializers.SerializerMethodField()
    can_be_confirmed = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'uuid',
            'retailer',
            'retailer_name',
            'wholesaler',
            'wholesaler_name',
            'retailer_user',
            'retailer_user_name',
            'status',
            'status_display',
            'payment_status',
            'payment_status_display',
            'subtotal',
            'tax_amount',
            'shipping_cost',
            'discount_amount',
            'total_amount',
            'currency',
            'tyrex_commission_rate',
            'tyrex_commission_amount',
            'delivery_address',
            'delivery_contact',
            'delivery_phone',
            'payment_terms_days',
            'due_date',
            'notes',
            'order_date',
            'confirmed_at',
            'shipped_at',
            'delivered_at',
            'canceled_at',
            'items',
            'total_items',
            'total_unique_products',
            'can_be_canceled',
            'can_be_confirmed',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'uuid', 'retailer', 'wholesaler', 'retailer_user',
            'subtotal', 'total_amount', 'tyrex_commission_amount', 'order_date',
            'confirmed_at', 'shipped_at', 'delivered_at', 'canceled_at',
            'created_at', 'updated_at'
        ]
    
    def get_retailer_user_name(self, obj):
        """Sipariş veren kullanıcı adı"""
        return f"{obj.retailer_user.first_name} {obj.retailer_user.last_name}".strip()
    
    def get_total_items(self, obj):
        """Toplam ürün adeti"""
        return obj.get_total_items()
    
    def get_total_unique_products(self, obj):
        """Farklı ürün sayısı"""
        return obj.get_total_unique_products()
    
    def get_can_be_canceled(self, obj):
        """İptal edilebilir mi?"""
        return obj.can_be_canceled()
    
    def get_can_be_confirmed(self, obj):
        """Onaylanabilir mi?"""
        return obj.can_be_confirmed()


class OrderListSerializer(serializers.ModelSerializer):
    """
    Sipariş listesi için özet serializer
    """
    retailer_name = serializers.CharField(source='retailer.name', read_only=True)
    wholesaler_name = serializers.CharField(source='wholesaler.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'retailer_name',
            'wholesaler_name',
            'status',
            'status_display',
            'payment_status',
            'payment_status_display',
            'total_amount',
            'currency',
            'total_items',
            'order_date',
            'due_date'
        ]
    
    def get_total_items(self, obj):
        """Toplam ürün adeti"""
        return obj.get_total_items()


class OrderStatusUpdateSerializer(serializers.Serializer):
    """
    Sipariş durumu güncelleme serializer'ı
    """
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_status(self, value):
        """Durum geçişinin geçerli olduğunu kontrol et"""
        order = self.context.get('order')
        if not order:
            return value
        
        # Geçerli durum geçişleri
        valid_transitions = {
            'draft': ['pending', 'canceled'],
            'pending': ['confirmed', 'canceled', 'rejected'],
            'confirmed': ['processing', 'canceled'],
            'processing': ['shipped', 'canceled'],
            'shipped': ['delivered'],
            'delivered': [],  # Teslim edilen sipariş değiştirilemez
            'canceled': [],   # İptal edilen sipariş değiştirilemez
            'rejected': [],   # Reddedilen sipariş değiştirilemez
        }
        
        current_status = order.status
        if value not in valid_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f'{order.get_status_display()} durumundan {dict(Order.STATUS_CHOICES)[value]} durumuna geçiş yapılamaz.'
            )
        
        return value


class CartItemSerializer(serializers.Serializer):
    """
    Sepet kalemi için basit serializer (sipariş öncesi)
    """
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    
    def validate_product_id(self, value):
        """Ürünün var olduğunu kontrol et"""
        try:
            Product.objects.get(id=value, is_active=True)
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError(f'ID {value} ile aktif ürün bulunamadı.')


class CartCalculationSerializer(serializers.Serializer):
    """
    Sepet hesaplama serializer'ı (sipariş vermeden önce fiyat hesaplama)
    """
    wholesaler_id = serializers.IntegerField()
    items = CartItemSerializer(many=True)
    
    def validate_wholesaler_id(self, value):
        """Toptancının var olduğunu kontrol et"""
        try:
            Company.objects.get(
                id=value,
                company_type__in=['wholesaler', 'both'],
                is_active=True
            )
            return value
        except Company.DoesNotExist:
            raise serializers.ValidationError(f'ID {value} ile aktif toptancı bulunamadı.')
    
    def calculate_cart(self):
        """Sepet toplamını hesapla (sipariş oluşturmadan)"""
        request = self.context['request']
        retailer = request.user.company
        
        validated_data = self.validated_data
        wholesaler_id = validated_data['wholesaler_id']
        wholesaler = Company.objects.get(id=wholesaler_id)
        
        cart_items = []
        total = Decimal('0.00')
        
        for item_data in validated_data['items']:
            product = Product.objects.get(id=item_data['product_id'])
            quantity = item_data['quantity']
            
            # En iyi stok kalemini bul
            stock_items = StockItem.objects.filter(
                product=product,
                warehouse__company=wholesaler,
                is_active=True,
                is_sellable=True,
                quantity__gte=quantity,
                sale_price__isnull=False
            ).order_by('sale_price')
            
            if not stock_items.exists():
                continue
            
            stock_item = stock_items.first()
            
            # Fiyat hesaplama (aynı mantık)
            base_price = stock_item.sale_price
            
            try:
                relationship = RetailerWholesaler.objects.get(
                    retailer=retailer,
                    wholesaler=wholesaler,
                    is_active=True
                )
                
                if relationship.credit_limit:
                    if relationship.credit_limit >= 100000:
                        discount_rate = Decimal('0.05')
                    elif relationship.credit_limit >= 50000:
                        discount_rate = Decimal('0.03')
                    else:
                        discount_rate = Decimal('0.01')
                else:
                    discount_rate = Decimal('0.02')
            except RetailerWholesaler.DoesNotExist:
                discount_rate = Decimal('0.00')
            
            # Tyrex komisyonu
            try:
                subscription = retailer.subscription
                tyrex_commission_rate = subscription.plan.get_tyrex_commission_decimal()
            except:
                tyrex_commission_rate = Decimal('0.025')
            
            discounted_price = base_price * (Decimal('1') - discount_rate)
            final_price = discounted_price * (Decimal('1') + tyrex_commission_rate)
            final_price = final_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            
            item_total = final_price * quantity
            total += item_total
            
            cart_items.append({
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'sku': product.sku,
                    'brand': product.brand
                },
                'quantity': quantity,
                'available_stock': stock_item.get_available_quantity(),
                'unit_price': str(final_price),
                'wholesaler_reference_price': str(base_price),
                'discount_percentage': str((discount_rate * 100).quantize(Decimal('0.1'))),
                'item_total': str(item_total),
                'warehouse': {
                    'id': stock_item.warehouse.id,
                    'name': stock_item.warehouse.name
                }
            })
        
        return {
            'wholesaler': {
                'id': wholesaler.id,
                'name': wholesaler.name
            },
            'items': cart_items,
            'subtotal': str(total),
            'total_amount': str(total),  # Şimdilik tax vs yok
            'currency': 'TRY',
            'total_items': sum(item['quantity'] for item in cart_items),
            'unique_products': len(cart_items)
        }