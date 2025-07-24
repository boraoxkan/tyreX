from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from .models import Warehouse, StockItem
from products.models import Product
from companies.models import Company


class WarehouseSerializer(serializers.ModelSerializer):
    """
    Depo yönetimi için temel serializer
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    total_products = serializers.SerializerMethodField()
    total_stock_value = serializers.SerializerMethodField()
    
    class Meta:
        model = Warehouse
        fields = [
            'id',
            'name',
            'code',
            'company',
            'company_name',
            'address',
            'city',
            'postal_code',
            'country',
            'phone',
            'email',
            'manager_name',
            'total_area',
            'storage_capacity',
            'warehouse_type',
            'is_active',
            'accepts_inbound',
            'accepts_outbound',
            'total_products',
            'total_stock_value',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'company', 'created_at', 'updated_at']
    
    def get_total_products(self, obj):
        """Depodaki toplam ürün çeşit sayısı"""
        return obj.get_total_products()
    
    def get_total_stock_value(self, obj):
        """Depodaki toplam stok değeri"""
        return str(obj.get_total_stock_value())
    
    def validate_code(self, value):
        """Depo kodu benzersizlik kontrolü"""
        request = self.context.get('request')
        if request and hasattr(request.user, 'company') and request.user.company:
            # Güncelleme durumunda mevcut kaydı hariç tut
            queryset = Warehouse.objects.filter(code=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError(
                    f"'{value}' kodu zaten kullanılmakta."
                )
        return value
    
    def create(self, validated_data):
        """Depo oluştururken otomatik olarak kullanıcının şirketini ata"""
        request = self.context['request']
        validated_data['company'] = request.user.company
        return super().create(validated_data)


class WarehouseCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Depo oluşturma ve güncelleme için özelleştirilmiş serializer
    """
    class Meta:
        model = Warehouse
        fields = [
            'name',
            'code',
            'address',
            'city',
            'postal_code',
            'country',
            'phone',
            'email',
            'manager_name',
            'total_area',
            'storage_capacity',
            'warehouse_type',
            'is_active',
            'accepts_inbound',
            'accepts_outbound'
        ]
    
    def validate_code(self, value):
        """Depo kodu benzersizlik kontrolü"""
        request = self.context.get('request')
        if request and hasattr(request.user, 'company') and request.user.company:
            queryset = Warehouse.objects.filter(code=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError(
                    f"'{value}' kodu zaten kullanılmakta."
                )
        return value


class ProductBasicSerializer(serializers.ModelSerializer):
    """
    Stok kalemi için ürün bilgileri
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'brand', 'category_name']
        read_only_fields = ['id', 'name', 'sku', 'brand', 'category_name']


class StockItemSerializer(serializers.ModelSerializer):
    """
    Stok kalemi yönetimi için temel serializer
    """
    product_details = ProductBasicSerializer(source='product', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.code', read_only=True)
    available_quantity = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    stock_status_display = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()
    
    class Meta:
        model = StockItem
        fields = [
            'id',
            'product',
            'product_details',
            'warehouse',
            'warehouse_name',
            'warehouse_code',
            'quantity',
            'reserved_quantity',
            'available_quantity',
            'minimum_stock',
            'maximum_stock',
            'cost_price',
            'sale_price',
            'location_code',
            'lot_number',
            'expiry_date',
            'stock_status',
            'stock_status_display',
            'total_value',
            'is_active',
            'is_sellable',
            'last_inbound_date',
            'last_outbound_date',
            'last_count_date',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id', 'available_quantity', 'stock_status', 'stock_status_display',
            'total_value', 'created_at', 'updated_at'
        ]
    
    def get_available_quantity(self, obj):
        """Satılabilir miktar"""
        return obj.get_available_quantity()
    
    def get_stock_status(self, obj):
        """Stok durumu kodu"""
        return obj.get_stock_status()
    
    def get_stock_status_display(self, obj):
        """Stok durumu açıklaması"""
        return obj.get_stock_status_display()
    
    def get_total_value(self, obj):
        """Toplam değer"""
        return str(obj.get_total_value())
    
    def validate(self, attrs):
        """Genel validasyon kuralları"""
        # Rezerve miktar kontrolü
        if attrs.get('reserved_quantity', 0) > attrs.get('quantity', 0):
            raise serializers.ValidationError({
                'reserved_quantity': 'Rezerve miktar, mevcut miktardan fazla olamaz.'
            })
        
        # Minimum-maksimum stok kontrolü
        minimum_stock = attrs.get('minimum_stock', 0)
        maximum_stock = attrs.get('maximum_stock')
        if maximum_stock and minimum_stock >= maximum_stock:
            raise serializers.ValidationError({
                'minimum_stock': 'Minimum stok, maksimum stoktan küçük olmalıdır.'
            })
        
        return attrs
    
    def validate_warehouse(self, value):
        """Kullanıcının sadece kendi depolarına stok ekleyebilmesini sağlar"""
        request = self.context.get('request')
        if request and hasattr(request.user, 'company') and request.user.company:
            if value.company != request.user.company:
                raise serializers.ValidationError(
                    'Bu depoya stok ekleme yetkiniz bulunmuyor.'
                )
        return value


class StockItemCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Stok kalemi oluşturma ve güncelleme için özelleştirilmiş serializer
    """
    class Meta:
        model = StockItem
        fields = [
            'product',
            'warehouse',
            'quantity',
            'reserved_quantity',
            'minimum_stock',
            'maximum_stock',
            'cost_price',
            'sale_price',
            'location_code',
            'lot_number',
            'expiry_date',
            'is_active',
            'is_sellable'
        ]
    
    def validate_product(self, value):
        """Ürünün var olduğunu ve aktif olduğunu kontrol eder"""
        if not value:
            raise serializers.ValidationError('Ürün seçimi zorunludur.')
        if not value.is_active:
            raise serializers.ValidationError('Seçilen ürün aktif değil.')
        return value
    
    def validate_warehouse(self, value):
        """Kullanıcının sadece kendi depolarına stok ekleyebilmesini sağlar"""
        request = self.context.get('request')
        if request and hasattr(request.user, 'company') and request.user.company:
            if value.company != request.user.company:
                raise serializers.ValidationError(
                    'Bu depoya stok ekleme yetkiniz bulunmuyor.'
                )
        if not value.is_active:
            raise serializers.ValidationError('Seçilen depo aktif değil.')
        return value
    
    def validate(self, attrs):
        """Genel validasyon kuralları"""
        # Rezerve miktar kontrolü
        reserved_quantity = attrs.get('reserved_quantity', 0)
        quantity = attrs.get('quantity', 0)
        if reserved_quantity > quantity:
            raise serializers.ValidationError({
                'reserved_quantity': 'Rezerve miktar, mevcut miktardan fazla olamaz.'
            })
        
        # Minimum-maksimum stok kontrolü
        minimum_stock = attrs.get('minimum_stock', 0)
        maximum_stock = attrs.get('maximum_stock')
        if maximum_stock and minimum_stock >= maximum_stock:
            raise serializers.ValidationError({
                'minimum_stock': 'Minimum stok, maksimum stoktan küçük olmalıdır.'
            })
        
        # Aynı ürün-depo-lot kombinasyonu kontrolü (create için)
        if not self.instance:
            product = attrs.get('product')
            warehouse = attrs.get('warehouse')
            lot_number = attrs.get('lot_number', '') or ''
            
            # Boş lot_number'ı None olarak ele al
            if lot_number == '':
                lot_number = None
            
            try:
                existing = StockItem.objects.filter(
                    product=product,
                    warehouse=warehouse,
                    lot_number=lot_number
                ).exists()
                
                if existing:
                    raise serializers.ValidationError({
                        'non_field_errors': ['Bu ürün-depo-lot kombinasyonu zaten mevcut. Farklı bir lot numarası kullanın veya mevcut kaydı güncelleyin.']
                    })
            except Exception as e:
                # Database hatası durumunda
                raise serializers.ValidationError({
                    'non_field_errors': [f'Validasyon sırasında hata oluştu: {str(e)}']
                })
        
        return attrs
        # Rezerve miktar kontrolü
        if attrs.get('reserved_quantity', 0) > attrs.get('quantity', 0):
            raise serializers.ValidationError({
                'reserved_quantity': 'Rezerve miktar, mevcut miktardan fazla olamaz.'
            })
        
        # Minimum-maksimum stok kontrolü
        minimum_stock = attrs.get('minimum_stock', 0)
        maximum_stock = attrs.get('maximum_stock')
        if maximum_stock and minimum_stock >= maximum_stock:
            raise serializers.ValidationError({
                'minimum_stock': 'Minimum stok, maksimum stoktan küçük olmalıdır.'
            })
        
        # Aynı ürün-depo-lot kombinasyonu kontrolü (create için)
        if not self.instance:
            product = attrs.get('product')
            warehouse = attrs.get('warehouse')
            lot_number = attrs.get('lot_number')
            
            existing = StockItem.objects.filter(
                product=product,
                warehouse=warehouse,
                lot_number=lot_number or ''
            ).exists()
            
            if existing:
                raise serializers.ValidationError(
                    'Bu ürün-depo-lot kombinasyonu zaten mevcut.'
                )
        
        return attrs


class StockMovementSerializer(serializers.Serializer):
    """
    Stok hareketi (giriş/çıkış) için serializer
    """
    MOVEMENT_TYPES = [
        ('inbound', 'Giriş'),
        ('outbound', 'Çıkış'),
        ('adjustment', 'Düzeltme'),
        ('transfer', 'Transfer')
    ]
    
    movement_type = serializers.ChoiceField(choices=MOVEMENT_TYPES)
    quantity = serializers.IntegerField(min_value=1)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True)
    reference_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_quantity(self, value):
        """Çıkış hareketleri için miktar kontrolü"""
        movement_type = self.initial_data.get('movement_type')
        if movement_type == 'outbound':
            stock_item = self.context.get('stock_item')
            if stock_item and value > stock_item.get_available_quantity():
                raise serializers.ValidationError(
                    f'Yetersiz stok. Maksimum {stock_item.get_available_quantity()} adet çıkış yapabilirsiniz.'
                )
        return value


class StockSummarySerializer(serializers.Serializer):
    """
    Stok özeti için serializer
    """
    warehouse_id = serializers.IntegerField()
    warehouse_name = serializers.CharField()
    warehouse_code = serializers.CharField()
    total_products = serializers.IntegerField()
    total_quantity = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    low_stock_items = serializers.IntegerField()
    out_of_stock_items = serializers.IntegerField()


class WarehouseSummarySerializer(serializers.Serializer):
    """
    Depo özeti için serializer
    """
    total_warehouses = serializers.IntegerField()
    active_warehouses = serializers.IntegerField()
    total_products = serializers.IntegerField()
    total_quantity = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    warehouses = StockSummarySerializer(many=True)