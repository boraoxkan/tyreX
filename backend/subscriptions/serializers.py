from rest_framework import serializers
from django.utils import timezone
from .models import SubscriptionPlan, Subscription, SubscriptionUsage


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """
    Abonelik planı serializer'ı
    """
    yearly_discount_percentage = serializers.ReadOnlyField(source='get_yearly_discount_percentage')
    tyrex_commission_decimal = serializers.ReadOnlyField(source='get_tyrex_commission_decimal')
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id',
            'name',
            'plan_type',
            'description',
            'monthly_price',
            'yearly_price',
            'yearly_discount_percentage',
            'max_users',
            'max_warehouses',
            'max_products',
            'api_rate_limit',
            'marketplace_access',
            'dynamic_pricing',
            'advanced_analytics',
            'priority_support',
            'customer_management_access',
            'full_dashboard_access',
            'tyrex_commission_rate',
            'tyrex_commission_decimal',
            'sort_order',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'yearly_discount_percentage',
            'tyrex_commission_decimal',
            'created_at',
        ]


class SubscriptionUsageSerializer(serializers.ModelSerializer):
    """
    Abonelik kullanım serializer'ı
    """
    
    class Meta:
        model = SubscriptionUsage
        fields = [
            'id',
            'period_start',
            'period_end',
            'api_calls',
            'marketplace_views',
            'orders_created',
            'revenue_generated',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SubscriptionSerializer(serializers.ModelSerializer):
    """
    Abonelik serializer'ı
    """
    plan = SubscriptionPlanSerializer(read_only=True)
    plan_name = serializers.ReadOnlyField(source='plan.name')
    company_name = serializers.ReadOnlyField(source='company.name')
    
    # Hesaplanan alanlar
    is_active_or_trialing = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    can_access_marketplace = serializers.ReadOnlyField()
    can_use_dynamic_pricing = serializers.ReadOnlyField()
    can_access_customer_management = serializers.ReadOnlyField()
    can_access_full_dashboard = serializers.ReadOnlyField()
    get_remaining_api_calls = serializers.ReadOnlyField()
    is_over_limits = serializers.ReadOnlyField()
    
    # Kullanım geçmişi
    usage_records = SubscriptionUsageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id',
            'company',
            'company_name',
            'plan',
            'plan_name',
            'status',
            'billing_cycle',
            'start_date',
            'trial_end_date',
            'current_period_start',
            'current_period_end',
            'canceled_at',
            'amount',
            'currency',
            'current_users',
            'current_warehouses',
            'current_products',
            'api_calls_this_month',
            'notes',
            'created_at',
            'updated_at',
            
            # Hesaplanan alanlar
            'is_active_or_trialing',
            'days_until_expiry',
            'can_access_marketplace',
            'can_use_dynamic_pricing',
            'can_access_customer_management',
            'can_access_full_dashboard',
            'get_remaining_api_calls',
            'is_over_limits',
            
            # İlişkili veriler
            'usage_records',
        ]
        read_only_fields = [
            'id',
            'company',
            'company_name',
            'plan_name',
            'created_at',
            'updated_at',
            
            # Hesaplanan alanlar
            'is_active_or_trialing',
            'days_until_expiry',
            'can_access_marketplace',
            'can_use_dynamic_pricing',
            'can_access_customer_management',
            'can_access_full_dashboard',
            'get_remaining_api_calls',
            'is_over_limits',
            
            # İlişkili veriler
            'usage_records',
        ]
    
    def validate(self, data):
        """
        Abonelik validasyonu
        """
        # Billing cycle kontrolü
        if 'billing_cycle' in data and 'plan' in data:
            plan = data.get('plan') or self.instance.plan
            if data['billing_cycle'] == 'yearly' and not plan.yearly_price:
                raise serializers.ValidationError({
                    'billing_cycle': 'Bu plan için yıllık ödeme seçeneği mevcut değil.'
                })
        
        return data
    
    def to_representation(self, instance):
        """
        Serialized data'yı özelleştir
        """
        data = super().to_representation(instance)
        
        # Durum displaylerini ekle
        data['status_display'] = instance.get_status_display()
        data['billing_cycle_display'] = instance.get_billing_cycle_display()
        
        # Formatlanmış tarihler
        if instance.trial_end_date:
            data['trial_end_date_formatted'] = instance.trial_end_date.strftime('%d.%m.%Y')
        
        if instance.current_period_end:
            data['current_period_end_formatted'] = instance.current_period_end.strftime('%d.%m.%Y')
        
        # Deneme durumu bilgisi
        if instance.status == 'trialing' and instance.trial_end_date:
            remaining_days = (instance.trial_end_date - timezone.now()).days
            data['trial_days_remaining'] = max(0, remaining_days)
            data['trial_expires_soon'] = remaining_days <= 3
        
        return data


class SubscriptionCreateSerializer(serializers.ModelSerializer):
    """
    Yeni abonelik oluşturma için serializer
    """
    plan_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'plan_id',
            'billing_cycle',
            'notes',
        ]
    
    def validate_plan_id(self, value):
        """
        Plan ID validasyonu
        """
        try:
            plan = SubscriptionPlan.objects.get(id=value, is_active=True)
            return plan
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError('Geçersiz plan ID.')
    
    def create(self, validated_data):
        """
        Yeni abonelik oluştur
        """
        plan = validated_data.pop('plan_id')
        validated_data['plan'] = plan
        
        # Şirket bilgisini request'ten al
        request = self.context.get('request')
        if request and hasattr(request.user, 'company'):
            validated_data['company'] = request.user.company
        else:
            raise serializers.ValidationError('Kullanıcının şirketi bulunmuyor.')
        
        # Varsayılan değerler
        validated_data.setdefault('status', 'trialing')
        validated_data.setdefault('start_date', timezone.now())
        
        return super().create(validated_data)