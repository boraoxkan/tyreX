from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from companies.models import Company, RetailerWholesaler

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Kullanıcı profili serializer'ı - Company ilişkili versiyon
    """
    company_name = serializers.SerializerMethodField()
    company_type = serializers.SerializerMethodField()
    company_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'date_joined',
            'is_active',
            'company_id',
            'company_name',
            'company_type'
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'is_active', 'company_id']
    
    def get_company_id(self, obj):
        """Şirket ID'sini döndürür"""
        return obj.company.id if obj.company else None
    
    def get_company_name(self, obj):
        """Şirket adını döndürür"""
        return obj.company.name if obj.company else None
    
    def get_company_type(self, obj):
        """Şirket türünü döndürür"""
        return obj.company.get_company_type_display() if obj.company else None


class RetailerWholesalerSerializer(serializers.ModelSerializer):
    """
    Perakendeci-Toptancı ilişkisi detay serializer'ı
    """
    wholesaler_name = serializers.CharField(source='wholesaler.name', read_only=True)
    wholesaler_email = serializers.CharField(source='wholesaler.email', read_only=True)
    wholesaler_phone = serializers.CharField(source='wholesaler.phone', read_only=True)
    
    class Meta:
        model = RetailerWholesaler
        fields = [
            'id',
            'wholesaler',
            'wholesaler_name',
            'wholesaler_email', 
            'wholesaler_phone',
            'is_active',
            'credit_limit',
            'payment_terms_days',
            'start_date',
            'notes'
        ]
        read_only_fields = ['id', 'start_date']


class AddWholesalerRelationSerializer(serializers.Serializer):
    """
    Perakendeciye yeni toptancı ilişkisi ekleme serializer'ı
    """
    wholesaler_id = serializers.IntegerField()
    credit_limit = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        required=False, 
        allow_null=True
    )
    payment_terms_days = serializers.IntegerField(default=30, min_value=1, max_value=365)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_wholesaler_id(self, value):
        """Toptancının var olduğunu ve aktif olduğunu kontrol et"""
        try:
            wholesaler = Company.objects.get(
                id=value,
                company_type__in=['wholesaler', 'both'],
                is_active=True
            )
            return value
        except Company.DoesNotExist:
            raise serializers.ValidationError(
                f'ID {value} ile aktif toptancı bulunamadı.'
            )
    
    def validate(self, attrs):
        """İlişkinin zaten var olmadığını kontrol et"""
        request = self.context.get('request')
        if request and hasattr(request.user, 'company') and request.user.company:
            existing = RetailerWholesaler.objects.filter(
                retailer=request.user.company,
                wholesaler_id=attrs['wholesaler_id'],
                is_active=True
            ).exists()
            
            if existing:
                raise serializers.ValidationError(
                    'Bu toptancı ile zaten aktif bir ilişkiniz bulunmakta.'
                )
        
        return attrs


class UpdateWholesalerRelationSerializer(serializers.ModelSerializer):
    """
    Mevcut toptancı ilişkisini güncelleme serializer'ı
    """
    class Meta:
        model = RetailerWholesaler
        fields = ['credit_limit', 'payment_terms_days', 'notes', 'is_active']
    
    def validate(self, attrs):
        """Sadece kendi ilişkilerini güncelleyebilsin"""
        request = self.context.get('request')
        if request and hasattr(request.user, 'company') and request.user.company:
            if self.instance.retailer != request.user.company:
                raise serializers.ValidationError(
                    'Bu ilişkiyi güncelleme yetkiniz yok.'
                )
        return attrs


class RetailerRegistrationSerializer(serializers.Serializer):
    """
    Perakendeci kayıt serializer'ı - Geliştirilmiş versiyon
    """
    # Kullanıcı bilgileri
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    
    # Şirket bilgileri
    company_name = serializers.CharField(max_length=200)
    company_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    company_address = serializers.CharField(required=False, allow_blank=True)
    
    # Çalışılan toptancılar - eski format (backward compatibility)
    wholesaler_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        help_text="Çalışmak istediğiniz toptancıların ID'leri (eski format)"
    )
    
    # Çalışılan toptancılar - yeni format (her biri için ayrı koşullar)
    wholesaler_relations = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        help_text="Toptancı ilişkileri: [{'wholesaler_id': 1, 'credit_limit': 50000, 'payment_terms_days': 30, 'notes': '...'}]"
    )
    
    # Ticari koşullar (eski format için - tüm toptancılara aynı koşullar)
    credit_limit = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        required=False, 
        allow_null=True
    )
    payment_terms_days = serializers.IntegerField(
        default=30,
        min_value=1,
        max_value=365
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        """Genel validasyon kuralları"""
        # Şifre kontrolü
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Şifreler eşleşmiyor.'
            })
        
        # Email benzersizlik kontrolü  
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({
                'email': 'Bu email adresi zaten kullanılmakta.'
            })
        
        # Şirket adı benzersizlik kontrolü
        if Company.objects.filter(name=attrs['company_name']).exists():
            raise serializers.ValidationError({
                'company_name': 'Bu şirket adı zaten kullanılmakta.'
            })
        
        return attrs
    
    def validate_wholesaler_ids(self, value):
        """Toptancı ID'lerinin geçerliliğini kontrol eder (eski format)"""
        if not value:
            return value
        
        # Tüm ID'lerin var olduğunu ve toptancı olduğunu kontrol et
        existing_wholesalers = Company.objects.filter(
            id__in=value,
            company_type__in=['wholesaler', 'both'],
            is_active=True
        )
        
        if len(existing_wholesalers) != len(value):
            missing_ids = set(value) - set(existing_wholesalers.values_list('id', flat=True))
            raise serializers.ValidationError(
                f'Geçersiz toptancı ID\'leri: {list(missing_ids)}'
            )
        
        return value
    
    def validate_wholesaler_relations(self, value):
        """Toptancı ilişkilerinin geçerliliğini kontrol eder (yeni format)"""
        if not value:
            return value
        
        validated_relations = []
        wholesaler_ids = []
        
        for relation in value:
            # Gerekli alanları kontrol et
            if 'wholesaler_id' not in relation:
                raise serializers.ValidationError(
                    'Her toptancı ilişkisi için wholesaler_id gereklidir.'
                )
            
            wholesaler_id = relation['wholesaler_id']
            
            # Duplicate kontrol
            if wholesaler_id in wholesaler_ids:
                raise serializers.ValidationError(
                    f'Toptancı ID {wholesaler_id} birden fazla kez belirtilmiş.'
                )
            wholesaler_ids.append(wholesaler_id)
            
            # Toptancının var olduğunu kontrol et
            try:
                wholesaler = Company.objects.get(
                    id=wholesaler_id,
                    company_type__in=['wholesaler', 'both'],
                    is_active=True
                )
            except Company.DoesNotExist:
                raise serializers.ValidationError(
                    f'ID {wholesaler_id} ile aktif toptancı bulunamadı.'
                )
            
            # Varsayılan değerleri ayarla
            validated_relation = {
                'wholesaler_id': wholesaler_id,
                'credit_limit': relation.get('credit_limit'),
                'payment_terms_days': relation.get('payment_terms_days', 30),
                'notes': relation.get('notes', '')
            }
            
            validated_relations.append(validated_relation)
        
        return validated_relations
    
    # backend/users/serializers.py - Updated create method
    @transaction.atomic
    def create(self, validated_data):
        """
        Perakendeci kaydı oluşturur - Otomatik 7 günlük deneme aboneliği ile
        """
        from decimal import Decimal
        from datetime import timedelta
        from django.utils import timezone
        
        # Şifre onayını çıkar
        validated_data.pop('password_confirm')
        
        # Toptancı ilişki bilgilerini ayır
        wholesaler_relations = validated_data.pop('wholesaler_relations', [])
        
        # Eski single fields için backward compatibility
        wholesaler_ids = validated_data.pop('wholesaler_ids', [])
        credit_limit = validated_data.pop('credit_limit', None)
        payment_terms_days = validated_data.pop('payment_terms_days', 30)
        notes = validated_data.pop('notes', '')
        
        # Eğer yeni format kullanılmadıysa eski formatı kullan
        if not wholesaler_relations and wholesaler_ids:
            wholesaler_relations = [
                {
                    'wholesaler_id': wid,
                    'credit_limit': credit_limit,
                    'payment_terms_days': payment_terms_days,
                    'notes': notes
                }
                for wid in wholesaler_ids
            ]
        
        # Şirket bilgilerini ayır
        company_data = {
            'name': validated_data.pop('company_name'),
            'company_type': 'retailer',
            'is_managed_by_tyrex': True,
            'email': validated_data['email'],  # Kullanıcı emaili ile aynı
            'phone': validated_data.pop('company_phone', ''),
            'address': validated_data.pop('company_address', ''),
            'is_active': True
        }
        
        # 1. Company oluştur
        company = Company.objects.create(**company_data)
        
        # 2. User oluştur ve company'ye bağla
        user_data = {
            'email': validated_data['email'],
            'first_name': validated_data['first_name'],
            'last_name': validated_data['last_name'],
            'company': company,
            'is_active': True
        }
        user = User.objects.create_user(
            password=validated_data['password'],
            **user_data
        )
        
        # 3. Otomatik 7 günlük deneme aboneliği oluştur
        subscription_created = False
        trial_subscription = None
        
        try:
            from subscriptions.models import SubscriptionPlan, Subscription
            
            # Basic planı al (deneme için)
            basic_plan = SubscriptionPlan.objects.get(plan_type='basic')
            
            # Deneme aboneliği oluştur
            trial_subscription = Subscription.objects.create(
                company=company,
                plan=basic_plan,
                status='trialing',
                billing_cycle='monthly',
                start_date=timezone.now(),
                trial_end_date=timezone.now() + timedelta(days=7),  # 7 günlük deneme
                current_period_start=timezone.now(),
                current_period_end=timezone.now() + timedelta(days=7),
                amount=Decimal('0.00'),  # Deneme sürümü ücretsiz
                currency='TRY',
                current_users=1,
                current_warehouses=0,
                current_products=0,
                api_calls_this_month=0,
                notes='Otomatik oluşturulan 7 günlük deneme aboneliği'
            )
            
            subscription_created = True
            
        except Exception as subscription_error:
            # Subscription oluşturulamazsa da kayıt devam etsin
            # Ama hatayı loglayalım
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Subscription creation failed: {subscription_error}")
            
            subscription_created = False
            trial_subscription = None
        
        # 4. RetailerWholesaler ilişkilerini oluştur
        retailer_wholesaler_relations = []
        for relation in wholesaler_relations:
            try:
                wholesaler = Company.objects.get(id=relation['wholesaler_id'])
                rw_relation = RetailerWholesaler(
                    retailer=company,
                    wholesaler=wholesaler,
                    is_active=True,
                    credit_limit=relation['credit_limit'],
                    payment_terms_days=relation['payment_terms_days'],
                    notes=relation['notes']
                )
                retailer_wholesaler_relations.append(rw_relation)
            except Company.DoesNotExist:
                continue
        
        # Toplu olarak kaydet
        if retailer_wholesaler_relations:
            RetailerWholesaler.objects.bulk_create(retailer_wholesaler_relations)
        
        return {
            'user': user,
            'company': company,
            'subscription': trial_subscription,
            'subscription_created': subscription_created,
            'wholesaler_relations_count': len(retailer_wholesaler_relations),
            'wholesaler_relations': retailer_wholesaler_relations
        }
    
    def to_representation(self, instance):
        """Başarılı kayıt sonrası döndürülecek veri yapısı - Abonelik bilgisi dahil"""
        if isinstance(instance, dict):
            user = instance['user']
            company = instance['company']
            subscription = instance.get('subscription')
            subscription_created = instance.get('subscription_created', False)
            relations_count = instance['wholesaler_relations_count']
            
            response_data = {
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'date_joined': user.date_joined
                },
                'company': {
                    'id': company.id,
                    'name': company.name,
                    'company_type': company.company_type,
                    'is_managed_by_tyrex': company.is_managed_by_tyrex
                },
                'subscription': {
                    'created': subscription_created,
                    'plan': subscription.plan.name if subscription else None,
                    'status': subscription.get_status_display() if subscription else None,
                    'trial_end_date': subscription.trial_end_date if subscription else None,
                    'marketplace_access': subscription.can_access_marketplace() if subscription else False,
                    'dynamic_pricing': subscription.can_use_dynamic_pricing() if subscription else False
                } if subscription else {
                    'created': False,
                    'plan': None,
                    'status': 'Plan oluşturulamadı',
                    'marketplace_access': False,
                    'dynamic_pricing': False
                },
                'wholesaler_relations_created': relations_count,
                'message': 'Perakendeci kaydı başarıyla oluşturuldu. 7 günlük ücretsiz deneme başlatıldı!'
            }
            
            if subscription_created:
                response_data['trial_info'] = {
                    'trial_days': 7,
                    'trial_features': [
                        'B2B Pazaryeri Erişimi',
                        'Dinamik Fiyatlandırma',
                        'Sipariş Yönetimi',
                        '3 Kullanıcı',
                        '2 Depo',
                        '500 Ürün Limiti'
                    ]
                }
            
            return response_data
        
        return instance
    
    def to_representation(self, instance):
        """Başarılı kayıt sonrası döndürülecek veri yapısı - Abonelik bilgisi dahil"""
        if isinstance(instance, dict):
            user = instance['user']
            company = instance['company']
            subscription = instance.get('subscription')
            subscription_created = instance.get('subscription_created', False)
            relations_count = instance['wholesaler_relations_count']
            
            response_data = {
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'date_joined': user.date_joined
                },
                'company': {
                    'id': company.id,
                    'name': company.name,
                    'company_type': company.company_type,
                    'is_managed_by_tyrex': company.is_managed_by_tyrex
                },
                'subscription': {
                    'created': subscription_created,
                    'plan': subscription.plan.name if subscription else None,
                    'status': subscription.get_status_display() if subscription else None,
                    'trial_end_date': subscription.trial_end_date if subscription else None,
                    'marketplace_access': subscription.can_access_marketplace() if subscription else False,
                    'dynamic_pricing': subscription.can_use_dynamic_pricing() if subscription else False
                } if subscription else {
                    'created': False,
                    'plan': None,
                    'status': 'Plan oluşturulamadı',
                    'marketplace_access': False,
                    'dynamic_pricing': False
                },
                'wholesaler_relations_created': relations_count,
                'message': 'Perakendeci kaydı başarıyla oluşturuldu. 7 günlük ücretsiz deneme başlatıldı!'
            }
            
            if subscription_created:
                response_data['trial_info'] = {
                    'trial_days': 7,
                    'trial_features': [
                        'B2B Pazaryeri Erişimi',
                        'Dinamik Fiyatlandırma',
                        'Sipariş Yönetimi',
                        '3 Kullanıcı',
                        '2 Depo',
                        '500 Ürün Limiti'
                    ]
                }
            
            return response_data
        
        return instance
    
    def to_representation(self, instance):
        """Başarılı kayıt sonrası döndürülecek veri yapısı"""
        if isinstance(instance, dict):
            user = instance['user']
            company = instance['company']
            relations_count = instance['wholesaler_relations_count']
            
            return {
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'date_joined': user.date_joined
                },
                'company': {
                    'id': company.id,
                    'name': company.name,
                    'company_type': company.company_type,
                    'is_managed_by_tyrex': company.is_managed_by_tyrex
                },
                'wholesaler_relations_created': relations_count,
                'message': 'Perakendeci kaydı başarıyla oluşturuldu.'
            }
        
        return instance


class WholesalerListSerializer(serializers.ModelSerializer):
    """
    Toptancı listesi için basit serializer
    """
    class Meta:
        model = Company
        fields = ['id', 'name', 'email', 'phone', 'address']
        read_only_fields = ['id', 'name', 'email', 'phone', 'address']