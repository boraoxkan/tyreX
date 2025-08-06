from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Customer, CustomerVisit, StoredTire


class CustomerSerializer(serializers.ModelSerializer):
    """Müşteri serializeri"""
    
    # Computed fields
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    total_tire_storage_count = serializers.IntegerField(
        source='get_total_tire_storage_count', 
        read_only=True
    )
    available_storage_capacity = serializers.IntegerField(
        source='get_available_storage_capacity', 
        read_only=True
    )
    is_storage_full = serializers.BooleanField(read_only=True)
    
    # Related field displays
    wholesaler_name = serializers.CharField(source='wholesaler.name', read_only=True)
    customer_type_display = serializers.CharField(source='get_customer_type_display', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'customer_type', 'customer_type_display',
            'wholesaler', 'wholesaler_name', 'email', 'phone', 'address',
            'company_name', 'tax_number', 'customer_code',
            'credit_limit', 'payment_terms_days', 'discount_rate',
            'is_active', 'is_vip', 'registration_date',
            'tire_hotel_enabled', 'tire_storage_capacity',
            'notes', 'created_at', 'updated_at',
            # Computed fields
            'full_name', 'total_tire_storage_count', 
            'available_storage_capacity', 'is_storage_full'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'registration_date', 'wholesaler']
    
    def validate(self, data):
        """Custom validation"""
        # Kurumsal müşteriler için şirket adı zorunlu
        if data.get('customer_type') == 'business' and not data.get('company_name'):
            raise serializers.ValidationError({
                'company_name': _('Kurumsal müşteriler için şirket adı zorunludur.')
            })
        
        # Lastik oteli aktifse kapasite belirtilmeli
        if data.get('tire_hotel_enabled') and not data.get('tire_storage_capacity'):
            raise serializers.ValidationError({
                'tire_storage_capacity': _('Lastik oteli aktifken depolama kapasitesi belirtilmelidir.')
            })
        
        return data


class CustomerListSerializer(serializers.ModelSerializer):
    """Müşteri listesi için basit serializeri"""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    wholesaler_name = serializers.CharField(source='wholesaler.name', read_only=True)
    customer_type_display = serializers.CharField(source='get_customer_type_display', read_only=True)
    total_visits = serializers.IntegerField(read_only=True)
    last_visit_date = serializers.DateTimeField(read_only=True)
    total_tire_storage_count = serializers.IntegerField(
        source='get_total_tire_storage_count', 
        read_only=True
    )
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'full_name', 'customer_type', 'customer_type_display',
            'wholesaler_name', 'phone', 'email', 'is_active', 'is_vip',
            'tire_hotel_enabled', 'total_tire_storage_count',
            'registration_date', 'total_visits', 'last_visit_date'
        ]


class CustomerVisitSerializer(serializers.ModelSerializer):
    """Müşteri ziyaret serializeri"""
    
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    visit_type_display = serializers.CharField(source='get_visit_type_display', read_only=True)
    served_by_name = serializers.CharField(source='served_by.get_full_name', read_only=True)
    
    class Meta:
        model = CustomerVisit
        fields = [
            'id', 'customer', 'customer_name', 'visit_type', 'visit_type_display',
            'visit_date', 'description', 'sale_amount', 'served_by', 'served_by_name',
            'is_completed', 'duration_minutes', 'customer_satisfaction', 'notes'
        ]
        read_only_fields = ['id', 'visit_date']
    
    def validate_customer_satisfaction(self, value):
        """Müşteri memnuniyeti 1-5 arasında olmalı"""
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError(
                _('Müşteri memnuniyeti 1 ile 5 arasında olmalıdır.')
            )
        return value


class StoredTireSerializer(serializers.ModelSerializer):
    """Depolanan lastik serializeri"""
    
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    tire_season_display = serializers.CharField(source='get_tire_season_display', read_only=True)
    tire_condition_display = serializers.CharField(source='get_tire_condition_display', read_only=True)
    storage_duration_days = serializers.IntegerField(source='get_storage_duration_days', read_only=True)
    is_overdue = serializers.BooleanField(source='is_overdue', read_only=True)
    total_storage_cost = serializers.DecimalField(
        source='calculate_total_storage_cost', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = StoredTire
        fields = [
            'id', 'customer', 'customer_name',
            'tire_brand', 'tire_model', 'tire_size', 'tire_season', 'tire_season_display',
            'quantity', 'has_rims', 'rim_brand', 'rim_size',
            'tire_condition', 'tire_condition_display', 'production_year',
            'storage_location', 'storage_date', 'planned_pickup_date', 'actual_pickup_date',
            'is_active', 'storage_fee_monthly', 'notes', 'special_instructions',
            'has_photos', 'created_at', 'updated_at',
            # Computed fields
            'storage_duration_days', 'is_overdue', 'total_storage_cost'
        ]
        read_only_fields = ['id', 'storage_date', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Custom validation"""
        customer = data.get('customer')
        
        # Müşterinin lastik oteli hizmeti aktif mi kontrol et
        if customer and not customer.tire_hotel_enabled:
            raise serializers.ValidationError({
                'customer': _('Bu müşteri için lastik oteli hizmeti aktif değil.')
            })
        
        # Depolama kapasitesi kontrol et
        if customer and customer.tire_storage_capacity:
            # Mevcut aktif depolanmış lastikleri say
            current_count = customer.stored_tires.filter(is_active=True).count()
            
            # Eğer yeni ekleme yapılıyorsa (id yok) veya farklı bir kayıt güncelleniyor
            if not self.instance or self.instance.customer != customer:
                if current_count >= customer.tire_storage_capacity:
                    raise serializers.ValidationError({
                        'customer': _('Bu müşterinin depolama kapasitesi dolu.')
                    })
        
        return data


class CustomerStatsSerializer(serializers.Serializer):
    """Müşteri istatistikleri serializeri"""
    
    total_customers = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    vip_customers = serializers.IntegerField()
    tire_hotel_customers = serializers.IntegerField()
    
    # Ziyaret istatistikleri
    total_visits_today = serializers.IntegerField()
    total_visits_this_month = serializers.IntegerField()
    avg_customer_satisfaction = serializers.DecimalField(max_digits=3, decimal_places=2)
    
    # Lastik oteli istatistikleri
    total_stored_tires = serializers.IntegerField()
    total_storage_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    overdue_pickups = serializers.IntegerField()


class CustomerDashboardSerializer(serializers.Serializer):
    """Müşteriler dashboard verisi"""
    
    stats = CustomerStatsSerializer()
    recent_visits = CustomerVisitSerializer(many=True)
    recent_tire_storage = StoredTireSerializer(many=True)
    top_customers = CustomerListSerializer(many=True)