from rest_framework import serializers
from django.db.models import Q, F, Case, When, Value, BooleanField
from decimal import Decimal, ROUND_HALF_UP
from products.models import Product
from inventory.models import StockItem
from companies.models import Company, RetailerWholesaler


class MarketProductSerializer(serializers.ModelSerializer):
    """
    B2B Pazaryeri için ürün serializer'ı
    Dinamik fiyatlandırma ve toptancı bilgileri dahil
    """
    # Ana ürün bilgileri
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_path = serializers.SerializerMethodField()
    
    # Stok ve fiyat bilgileri
    total_stock = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()
    base_price = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    
    # Toptancı bilgileri
    wholesaler_info = serializers.SerializerMethodField()
    is_known_wholesaler = serializers.SerializerMethodField()
    
    # Ürün özellikleri
    attributes = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'slug',
            'sku',
            'brand',
            'model',
            'short_description',
            'category_name',
            'category_path',
            'weight',
            'total_stock',
            'available_stock',
            'base_price',
            'final_price',
            'discount_percentage',
            'wholesaler_info',
            'is_known_wholesaler',
            'attributes',
            'is_active',
            'created_at'
        ]
        read_only_fields = ['id', 'slug', 'sku', 'created_at']
    
    def get_category_path(self, obj):
        """Kategori hiyerarşi yolunu döndürür"""
        return obj.category.get_full_path() if obj.category else None
    
    def get_total_stock(self, obj):
        """Tüm depolardaki toplam stok miktarı"""
        return getattr(obj, 'total_stock', 0)
    
    def get_available_stock(self, obj):
        """Satılabilir stok miktarı (rezerve edilmeyen)"""
        return getattr(obj, 'available_stock', 0)
    
    def get_base_price(self, obj):
        """Temel satış fiyatı (ortalama)"""
        base_price = getattr(obj, 'avg_sale_price', None)
        if base_price:
            return str(base_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        return None
    
    def get_final_price(self, obj):
        """
        Dinamik hesaplanan final fiyat
        Formula: (sale_price * (1 - toptanci_iskontosu)) * (1 + tyrex_komisyonu)
        """
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'company'):
            return self.get_base_price(obj)
        
        try:
            user_company = request.user.company
            subscription = user_company.subscription
            tyrex_commission = subscription.plan.get_tyrex_commission_decimal()
            
            # Ürünün en iyi stok kalemini bul
            best_stock_item = getattr(obj, 'best_stock_item', None)
            if not best_stock_item or not best_stock_item.sale_price:
                return self.get_base_price(obj)
            
            base_price = best_stock_item.sale_price
            
            # Toptancı iskontosunu hesapla
            discount_rate = self._get_wholesaler_discount_rate(
                user_company, 
                best_stock_item.warehouse.company
            )
            
            # Final fiyat hesaplama
            discounted_price = base_price * (Decimal('1') - discount_rate)
            final_price = discounted_price * (Decimal('1') + tyrex_commission)
            
            return str(final_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            
        except Exception as e:
            # Hata durumunda base price döndür
            return self.get_base_price(obj)
    
    def get_discount_percentage(self, obj):
        """İndirim yüzdesini hesaplar"""
        base_price_str = self.get_base_price(obj)
        final_price_str = self.get_final_price(obj)
        
        if not base_price_str or not final_price_str:
            return 0
        
        try:
            base_price = Decimal(base_price_str)
            final_price = Decimal(final_price_str)
            
            if base_price > final_price:
                discount = ((base_price - final_price) / base_price) * 100
                return float(discount.quantize(Decimal('0.1'), rounding=ROUND_HALF_UP))
            
            return 0
        except:
            return 0
    
    def get_wholesaler_info(self, obj):
        """Ürünü satan toptancı bilgileri"""
        best_stock_item = getattr(obj, 'best_stock_item', None)
        if not best_stock_item:
            return None
        
        wholesaler = best_stock_item.warehouse.company
        return {
            'id': wholesaler.id,
            'name': wholesaler.name,
            'email': wholesaler.email,
            'phone': wholesaler.phone,
            'address': wholesaler.address
        }
    
    def get_is_known_wholesaler(self, obj):
        """Bu ürünün toptancısı, perakendecinin çalıştığı toptancılardan biri mi?"""
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'company'):
            return False
        
        best_stock_item = getattr(obj, 'best_stock_item', None)
        if not best_stock_item:
            return False
        
        wholesaler = best_stock_item.warehouse.company
        user_company = request.user.company
        
        # Perakendecinin çalıştığı toptancılar arasında mı kontrol et
        return RetailerWholesaler.objects.filter(
            retailer=user_company,
            wholesaler=wholesaler,
            is_active=True
        ).exists()
    
    def get_attributes(self, obj):
        """Ürün özelliklerini döndürür"""
        attributes = []
        for attr_value in obj.attribute_values.select_related('attribute'):
            attributes.append({
                'name': attr_value.attribute.name,
                'value': attr_value.get_value(),
                'unit': attr_value.attribute.unit or None
            })
        return attributes
    
    def _get_wholesaler_discount_rate(self, retailer_company, wholesaler_company):
        """
        Perakendeci-toptancı ilişkisine göre iskonto oranını hesaplar
        Şimdilik sabit değerler, ileride dinamik hale getirilebilir
        """
        try:
            relationship = RetailerWholesaler.objects.get(
                retailer=retailer_company,
                wholesaler=wholesaler_company,
                is_active=True
            )
            
            # Kredi limitine göre iskonto hesapla (örnek mantık)
            if relationship.credit_limit:
                if relationship.credit_limit >= 100000:
                    return Decimal('0.05')  # %5 iskonto
                elif relationship.credit_limit >= 50000:
                    return Decimal('0.03')  # %3 iskonto
                else:
                    return Decimal('0.01')  # %1 iskonto
            
            return Decimal('0.02')  # Varsayılan %2 iskonto
            
        except RetailerWholesaler.DoesNotExist:
            # İlişki yoksa iskonto yok
            return Decimal('0.00')


class MarketProductFilterSerializer(serializers.Serializer):
    """
    Pazaryeri ürün filtreleme için serializer
    """
    category = serializers.IntegerField(required=False, help_text="Kategori ID'si")
    brand = serializers.CharField(required=False, max_length=100, help_text="Marka adı")
    min_price = serializers.DecimalField(
        required=False, 
        max_digits=10, 
        decimal_places=2,
        help_text="Minimum fiyat"
    )
    max_price = serializers.DecimalField(
        required=False, 
        max_digits=10, 
        decimal_places=2,
        help_text="Maksimum fiyat"
    )
    in_stock = serializers.BooleanField(
        required=False, 
        default=True,
        help_text="Sadece stokta olan ürünler"
    )
    known_wholesalers_only = serializers.BooleanField(
        required=False, 
        default=False,
        help_text="Sadece çalıştığım toptancıların ürünleri"  
    )
    search = serializers.CharField(
        required=False, 
        max_length=200,
        help_text="Ürün adı, marka veya SKU ile arama"
    )
    ordering = serializers.ChoiceField(
        required=False,
        choices=[
            ('name', 'Ürün adına göre A-Z'),
            ('-name', 'Ürün adına göre Z-A'),
            ('final_price', 'Fiyata göre artan'),
            ('-final_price', 'Fiyata göre azalan'),
            ('-total_stock', 'Stok miktarına göre azalan'),
            ('-created_at', 'Yeniden eskiye'),
            ('created_at', 'Eskiden yeniye'),
        ],
        default='-created_at',
        help_text="Sıralama kriteri"
    )


class MarketplaceStatsSerializer(serializers.Serializer):
    """
    Pazaryeri istatistikleri için serializer
    """
    total_products = serializers.IntegerField()
    total_wholesalers = serializers.IntegerField()
    known_wholesalers = serializers.IntegerField()
    products_in_stock = serializers.IntegerField()
    average_discount = serializers.DecimalField(max_digits=5, decimal_places=2)
    categories_count = serializers.IntegerField()
    your_potential_savings = serializers.DecimalField(max_digits=12, decimal_places=2)