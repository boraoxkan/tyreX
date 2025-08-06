from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal

class Customer(models.Model):
    """
    Müşteri modeli - Toptancıların müşterilerini takip etmek için
    """
    CUSTOMER_TYPES = [
        ('individual', _('Bireysel Müşteri')),
        ('business', _('Kurumsal Müşteri')),
        ('fleet', _('Filo Müşterisi')),
    ]
    
    # Temel bilgiler
    name = models.CharField(_('Müşteri Adı'), max_length=200)
    customer_type = models.CharField(
        _('Müşteri Türü'),
        max_length=20,
        choices=CUSTOMER_TYPES,
        default='individual'
    )
    
    # Toptancı ilişkisi
    wholesaler = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='customers',
        verbose_name=_('Toptancı'),
        limit_choices_to={'company_type__in': ['wholesaler', 'both']}
    )
    
    # İletişim bilgileri
    email = models.EmailField(_('E-posta'), blank=True, null=True)
    phone = models.CharField(_('Telefon'), max_length=20, blank=True, null=True)
    address = models.TextField(_('Adres'), blank=True, null=True)
    
    # Kurumsal müşteriler için
    company_name = models.CharField(
        _('Şirket Adı'),
        max_length=200,
        blank=True,
        null=True,
        help_text=_('Kurumsal müşteriler için şirket adı')
    )
    tax_number = models.CharField(
        _('Vergi Numarası'),
        max_length=20,
        blank=True,
        null=True
    )
    
    # Müşteri kodları
    customer_code = models.CharField(
        _('Müşteri Kodu'),
        max_length=50,
        blank=True,
        null=True,
        help_text=_('Toptancının kendi sistemindeki müşteri kodu')
    )
    
    # Ticari bilgiler
    credit_limit = models.DecimalField(
        _('Kredi Limiti'),
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    payment_terms_days = models.PositiveIntegerField(
        _('Ödeme Vadesi (Gün)'),
        default=30
    )
    discount_rate = models.DecimalField(
        _('İndirim Oranı (%)'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Durum bilgileri
    is_active = models.BooleanField(_('Aktif Müşteri'), default=True)
    is_vip = models.BooleanField(_('VIP Müşteri'), default=False)
    registration_date = models.DateField(
        _('Kayıt Tarihi'),
        auto_now_add=True
    )
    
    # Lastik Oteli özelliği
    tire_hotel_enabled = models.BooleanField(
        _('Lastik Oteli Hizmeti'),
        default=False,
        help_text=_('Bu müşteri lastik oteli hizmetini kullanıyor mu?')
    )
    tire_storage_capacity = models.PositiveIntegerField(
        _('Lastik Depolama Kapasitesi'),
        blank=True,
        null=True,
        help_text=_('Maksimum depolanabilir lastik takım sayısı')
    )
    
    # Notlar
    notes = models.TextField(_('Notlar'), blank=True, null=True)
    
    # Meta bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Güncellenme Tarihi'), auto_now=True)
    
    class Meta:
        verbose_name = _('Müşteri')
        verbose_name_plural = _('Müşteriler')
        unique_together = ['wholesaler', 'customer_code']
        ordering = ['name']
        indexes = [
            models.Index(fields=['wholesaler', 'is_active']),
            models.Index(fields=['customer_type']),
            models.Index(fields=['tire_hotel_enabled']),
        ]
    
    def __str__(self):
        display_name = self.company_name if self.company_name else self.name
        return f"{display_name} - {self.wholesaler.name}"
    
    def get_full_name(self):
        """Müşterinin tam adını döndürür"""
        if self.customer_type == 'business' and self.company_name:
            return f"{self.company_name} ({self.name})"
        return self.name
    
    def get_total_tire_storage_count(self):
        """Depolanan toplam lastik takım sayısını döndürür"""
        return self.stored_tires.filter(is_active=True).count()
    
    def get_available_storage_capacity(self):
        """Kullanılabilir depolama kapasitesini döndürür"""
        if not self.tire_storage_capacity:
            return None
        
        used_capacity = self.get_total_tire_storage_count()
        return max(0, self.tire_storage_capacity - used_capacity)
    
    def is_storage_full(self):
        """Depolama kapasitesi dolu mu kontrol eder"""
        if not self.tire_storage_capacity:
            return False
        
        return self.get_total_tire_storage_count() >= self.tire_storage_capacity


class CustomerVisit(models.Model):
    """
    Müşteri ziyaret takibi - Müşterilerin giriş-çıkış kayıtları
    """
    VISIT_TYPES = [
        ('purchase', _('Satın Alma')),
        ('tire_storage', _('Lastik Depolama')),
        ('tire_pickup', _('Lastik Teslim Alma')),
        ('maintenance', _('Bakım/Onarım')),
        ('consultation', _('Danışmanlık')),
        ('other', _('Diğer')),
    ]
    
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='visits',
        verbose_name=_('Müşteri')
    )
    
    # Ziyaret bilgileri
    visit_type = models.CharField(
        _('Ziyaret Türü'),
        max_length=20,
        choices=VISIT_TYPES
    )
    visit_date = models.DateTimeField(_('Ziyaret Tarihi'), auto_now_add=True)
    
    # İşlem detayları
    description = models.TextField(
        _('Açıklama'),
        help_text=_('Ziyaret sırasında yapılan işlemler')
    )
    
    # Satış bilgileri (varsa)
    sale_amount = models.DecimalField(
        _('Satış Tutarı'),
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Personel bilgisi
    served_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='customer_visits',
        verbose_name=_('Hizmet Veren Personel')
    )
    
    # Durum bilgileri
    is_completed = models.BooleanField(_('Tamamlandı'), default=True)
    duration_minutes = models.PositiveIntegerField(
        _('Süre (Dakika)'),
        blank=True,
        null=True
    )
    
    # Memnuniyet değerlendirmesi
    customer_satisfaction = models.PositiveIntegerField(
        _('Müşteri Memnuniyeti (1-5)'),
        blank=True,
        null=True,
        help_text=_('1=Çok Kötü, 5=Mükemmel')
    )
    
    notes = models.TextField(_('Notlar'), blank=True, null=True)
    
    class Meta:
        verbose_name = _('Müşteri Ziyareti')
        verbose_name_plural = _('Müşteri Ziyaretleri')
        ordering = ['-visit_date']
        indexes = [
            models.Index(fields=['customer', 'visit_date']),
            models.Index(fields=['visit_type']),
            models.Index(fields=['-visit_date']),
        ]
    
    def __str__(self):
        return f"{self.customer.name} - {self.get_visit_type_display()} ({self.visit_date.strftime('%d.%m.%Y %H:%M')})"


class StoredTire(models.Model):
    """
    Depolanan lastik takımı - Lastik Oteli hizmeti için
    """
    TIRE_SEASONS = [
        ('summer', _('Yaz Lastiği')),
        ('winter', _('Kış Lastiği')),
        ('all_season', _('4 Mevsim')),
    ]
    
    TIRE_CONDITIONS = [
        ('excellent', _('Mükemmel')),
        ('good', _('İyi')),
        ('fair', _('Orta')),
        ('poor', _('Kötü')),
        ('damaged', _('Hasarlı')),
    ]
    
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='stored_tires',
        verbose_name=_('Müşteri')
    )
    
    # Lastik bilgileri
    tire_brand = models.CharField(_('Lastik Markası'), max_length=100)
    tire_model = models.CharField(_('Lastik Modeli'), max_length=100)
    tire_size = models.CharField(
        _('Lastik Ebadı'),
        max_length=50,
        help_text=_('Örn: 205/55R16')
    )
    tire_season = models.CharField(
        _('Mevsim Tipi'),
        max_length=20,
        choices=TIRE_SEASONS
    )
    
    # Takım bilgileri
    quantity = models.PositiveIntegerField(
        _('Adet'),
        default=4,
        help_text=_('Genellikle 4 adet (1 takım)')
    )
    
    # Jant bilgileri (opsiyonel)
    has_rims = models.BooleanField(_('Jantlı'), default=False)
    rim_brand = models.CharField(
        _('Jant Markası'),
        max_length=100,
        blank=True,
        null=True
    )
    rim_size = models.CharField(
        _('Jant Ebadı'),
        max_length=50,
        blank=True,
        null=True
    )
    
    # Durum bilgileri
    tire_condition = models.CharField(
        _('Lastik Durumu'),
        max_length=20,
        choices=TIRE_CONDITIONS,
        default='good'
    )
    production_year = models.PositiveIntegerField(
        _('Üretim Yılı'),
        blank=True,
        null=True
    )
    
    # Depolama bilgileri
    storage_location = models.CharField(
        _('Depolama Yeri'),
        max_length=100,
        help_text=_('Depodaki konum (Raf: A1-B2 gibi)')
    )
    
    # Tarihler
    storage_date = models.DateTimeField(
        _('Depolama Tarihi'),
        auto_now_add=True
    )
    planned_pickup_date = models.DateField(
        _('Planlanan Teslim Tarihi'),
        blank=True,
        null=True
    )
    actual_pickup_date = models.DateTimeField(
        _('Gerçek Teslim Tarihi'),
        blank=True,
        null=True
    )
    
    # Durum
    is_active = models.BooleanField(
        _('Aktif'),
        default=True,
        help_text=_('False ise teslim edilmiş demektir')
    )
    
    # Fiyatlandırma
    storage_fee_monthly = models.DecimalField(
        _('Aylık Depolama Ücreti'),
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True
    )
    
    # Notlar ve özel işaretler
    notes = models.TextField(_('Notlar'), blank=True, null=True)
    special_instructions = models.TextField(
        _('Özel Talimatlar'),
        blank=True,
        null=True,
        help_text=_('Lastiklerin bakımı veya saklanması ile ilgili özel notlar')
    )
    
    # Fotoğraflar için placeholder (gelecekte file field eklenebilir)
    has_photos = models.BooleanField(_('Fotoğraf Var'), default=False)
    
    # Meta bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Güncellenme Tarihi'), auto_now=True)
    
    class Meta:
        verbose_name = _('Depolanan Lastik')
        verbose_name_plural = _('Depolanan Lastikler')
        ordering = ['-storage_date']
        indexes = [
            models.Index(fields=['customer', 'is_active']),
            models.Index(fields=['tire_season']),
            models.Index(fields=['storage_date']),
            models.Index(fields=['planned_pickup_date']),
        ]
    
    def __str__(self):
        return f"{self.customer.name} - {self.tire_brand} {self.tire_model} ({self.tire_size})"
    
    def get_storage_duration_days(self):
        """Depolama süresini gün olarak hesaplar"""
        from django.utils import timezone
        
        end_date = self.actual_pickup_date or timezone.now()
        return (end_date.date() - self.storage_date.date()).days
    
    def is_overdue(self):
        """Planlanan teslim tarihini geçti mi?"""
        from django.utils import timezone
        
        if not self.planned_pickup_date or not self.is_active:
            return False
        
        return timezone.now().date() > self.planned_pickup_date
    
    def get_monthly_storage_fee(self):
        """Aylık depolama ücretini hesaplar"""
        if self.storage_fee_monthly:
            return self.storage_fee_monthly
        
        # Varsayılan ücret (ayarlardan gelebilir)
        return Decimal('50.00')  # Aylık 50 TL varsayılan
    
    def calculate_total_storage_cost(self):
        """Toplam depolama maliyetini hesaplar"""
        days = self.get_storage_duration_days()
        monthly_fee = self.get_monthly_storage_fee()
        
        # Günlük ücreti hesapla
        daily_fee = monthly_fee / 30
        
        return daily_fee * days
    
    def clean(self):
        """Model doğrulama kuralları"""
        from django.core.exceptions import ValidationError
        from django.utils import timezone
        
        if self.planned_pickup_date and self.planned_pickup_date < self.storage_date.date():
            raise ValidationError({
                'planned_pickup_date': _('Planlanan teslim tarihi, depolama tarihinden önce olamaz.')
            })
        
        if self.actual_pickup_date and self.actual_pickup_date < self.storage_date:
            raise ValidationError({
                'actual_pickup_date': _('Teslim tarihi, depolama tarihinden önce olamaz.')
            })
        
        if not self.customer.tire_hotel_enabled:
            raise ValidationError(_('Bu müşteri için lastik oteli hizmeti aktif değil.'))