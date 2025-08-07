from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone


class SubscriptionPlan(models.Model):
    """
    Abonelik planları - Farklı seviyeler ve özellikler
    """
    PLAN_TYPES = [
        ('pro', _('PRO')),
        ('ultra', _('ULTRA')),
    ]
    
    name = models.CharField(_('Plan Adı'), max_length=100)
    plan_type = models.CharField(
        _('Plan Türü'), 
        max_length=20, 
        choices=PLAN_TYPES,
        unique=True
    )
    description = models.TextField(_('Açıklama'), blank=True, null=True)
    
    # Fiyatlandırma
    monthly_price = models.DecimalField(
        _('Aylık Fiyat'), 
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    yearly_price = models.DecimalField(
        _('Yıllık Fiyat'), 
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        blank=True,
        null=True,
        help_text=_('Yıllık ödeme yapıldığında uygulanacak fiyat')
    )
    
    # Plan Özellikleri
    max_users = models.PositiveIntegerField(
        _('Maksimum Kullanıcı Sayısı'),
        default=1,
        help_text=_('Bu planda kaç kullanıcı olabilir')
    )
    max_warehouses = models.PositiveIntegerField(
        _('Maksimum Depo Sayısı'),
        default=1,
        help_text=_('Bu planda kaç depo oluşturulabilir')
    )
    max_products = models.PositiveIntegerField(
        _('Maksimum Ürün Sayısı'),
        default=100,
        help_text=_('Bu planda kaç ürün stoklanabilir')
    )
    
    # API ve Pazaryeri Erişimi
    api_rate_limit = models.PositiveIntegerField(
        _('API İstek Limiti (günlük)'),
        default=1000,
        help_text=_('Günde kaç API isteği yapılabilir')
    )
    marketplace_access = models.BooleanField(
        _('Pazaryeri Erişimi'), 
        default=False,
        help_text=_('B2B pazaryerine erişebilir mi?')
    )
    dynamic_pricing = models.BooleanField(
        _('Dinamik Fiyatlandırma'),
        default=False,
        help_text=_('Dinamik fiyat hesaplama özelliği')
    )
    advanced_analytics = models.BooleanField(
        _('Gelişmiş Analitik'),
        default=False,
        help_text=_('Detaylı raporlar ve analitics')
    )
    priority_support = models.BooleanField(
        _('Öncelikli Destek'),
        default=False,
        help_text=_('Öncelikli müşteri desteği')
    )
    customer_management_access = models.BooleanField(
        _('Müşteri Takibi Erişimi'),
        default=False,
        help_text=_('Müşteri yönetim sayfasına erişebilir mi?')
    )
    full_dashboard_access = models.BooleanField(
        _('Tam Dashboard Erişimi'),
        default=False,
        help_text=_('Tüm dashboard sayfalarına erişebilir mi?')
    )
    
    # Komisyon Oranları (Pazaryeri için)
    tyrex_commission_rate = models.DecimalField(
        _('Tyrex Komisyon Oranı (%)'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('2.50'),
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text=_('Pazaryeri işlemlerinden alınacak komisyon yüzdesi')
    )
    
    # Plan Durumu
    is_active = models.BooleanField(_('Aktif'), default=True)
    sort_order = models.PositiveIntegerField(_('Sıra'), default=0)
    
    # Meta Bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Güncellenme Tarihi'), auto_now=True)
    
    class Meta:
        verbose_name = _('Abonelik Planı')
        verbose_name_plural = _('Abonelik Planları')
        ordering = ['sort_order', 'monthly_price']
    
    def __str__(self):
        return f"{self.name} - ₺{self.monthly_price}/ay"
    
    def get_yearly_discount_percentage(self):
        """Yıllık ödeme indirimi yüzdesini hesaplar"""
        if self.yearly_price and self.monthly_price > 0:
            monthly_total = self.monthly_price * 12
            if monthly_total > self.yearly_price:
                discount = (monthly_total - self.yearly_price) / monthly_total * 100
                return round(discount, 1)
        return 0
    
    def get_tyrex_commission_decimal(self):
        """Komisyon oranını decimal olarak döndürür (2.5% -> 0.025)"""
        return self.tyrex_commission_rate / 100


class Subscription(models.Model):
    """
    Şirket abonelikleri - Hangi şirketin hangi planı kullandığı
    """
    STATUS_CHOICES = [
        ('trialing', _('Deneme Sürümü')),
        ('active', _('Aktif')),
        ('past_due', _('Ödeme Gecikmesi')),
        ('canceled', _('İptal Edildi')),
        ('unpaid', _('Ödenmedi')),
        ('expired', _('Süresi Doldu')),
    ]
    
    BILLING_CYCLES = [
        ('monthly', _('Aylık')),
        ('yearly', _('Yıllık')),
    ]
    
    company = models.OneToOneField(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='subscription',
        verbose_name=_('Şirket')
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
        verbose_name=_('Abonelik Planı')
    )
    
    # Abonelik Durumu
    status = models.CharField(
        _('Durum'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='trialing'
    )
    billing_cycle = models.CharField(
        _('Faturalandırma Döngüsü'),
        max_length=20,
        choices=BILLING_CYCLES,
        default='monthly'
    )
    
    # Tarihler
    start_date = models.DateTimeField(_('Başlangıç Tarihi'), default=timezone.now)
    trial_end_date = models.DateTimeField(
        _('Deneme Bitiş Tarihi'),
        blank=True,
        null=True,
        help_text=_('Deneme sürümü bitiş tarihi')
    )
    current_period_start = models.DateTimeField(
        _('Mevcut Dönem Başlangıcı'),
        default=timezone.now
    )
    current_period_end = models.DateTimeField(
        _('Mevcut Dönem Bitişi'),
        blank=True,
        null=True
    )
    canceled_at = models.DateTimeField(
        _('İptal Tarihi'),
        blank=True,
        null=True
    )
    
    # Fiyatlandırma
    amount = models.DecimalField(
        _('Tutar'),
        max_digits=10,
        decimal_places=2,
        help_text=_('Mevcut dönem için ödenen/ödenecek tutar')
    )
    currency = models.CharField(
        _('Para Birimi'),
        max_length=3,
        default='TRY'
    )
    
    # Kullanım İstatistikleri
    current_users = models.PositiveIntegerField(
        _('Mevcut Kullanıcı Sayısı'),
        default=0
    )
    current_warehouses = models.PositiveIntegerField(
        _('Mevcut Depo Sayısı'),
        default=0
    )
    current_products = models.PositiveIntegerField(
        _('Mevcut Ürün Sayısı'),
        default=0
    )
    api_calls_this_month = models.PositiveIntegerField(
        _('Bu Ayki API Çağrısı'),
        default=0
    )
    
    # Notlar
    notes = models.TextField(_('Notlar'), blank=True, null=True)
    
    # Meta Bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Güncellenme Tarihi'), auto_now=True)
    
    class Meta:
        verbose_name = _('Abonelik')
        verbose_name_plural = _('Abonelikler')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.company.name} - {self.plan.name} ({self.get_status_display()})"
    
    def is_active_or_trialing(self):
        """Abonelik aktif veya deneme sürümünde mi?"""
        if self.status in ['active', 'trialing']:
            # Deneme sürümündeyse ve süresi dolmuşsa False
            if self.status == 'trialing' and self.trial_end_date:
                return timezone.now() <= self.trial_end_date
            # Aktifse ve dönem bitmemişse True
            elif self.status == 'active' and self.current_period_end:
                return timezone.now() <= self.current_period_end
            # Diğer durumlarda True (süre kontrolü yapılamıyorsa)
            return True
        return False
    
    def days_until_expiry(self):
        """Abonelik bitişine kadar kalan gün sayısı"""
        expiry_date = None
        
        if self.status == 'trialing' and self.trial_end_date:
            expiry_date = self.trial_end_date
        elif self.status == 'active' and self.current_period_end:
            expiry_date = self.current_period_end
        
        if expiry_date:
            delta = expiry_date - timezone.now()
            return max(0, delta.days)
        
        return None
    
    def can_access_marketplace(self):
        """Pazaryerine erişebilir mi?"""
        return self.is_active_or_trialing() and self.plan.marketplace_access
    
    def can_use_dynamic_pricing(self):
        """Dinamik fiyatlandırma kullanabilir mi?"""
        return self.is_active_or_trialing() and self.plan.dynamic_pricing
    
    def can_access_customer_management(self):
        """Müşteri yönetim sayfasına erişebilir mi?"""
        return self.is_active_or_trialing() and self.plan.customer_management_access
    
    def can_access_full_dashboard(self):
        """Tüm dashboard sayfalarına erişebilir mi?"""
        return self.is_active_or_trialing() and self.plan.full_dashboard_access
    
    def get_remaining_api_calls(self):
        """Kalan API çağrısı sayısı"""
        return max(0, self.plan.api_rate_limit - self.api_calls_this_month)
    
    def is_over_limits(self):
        """Herhangi bir limiti aştı mı?"""
        limits = {
            'users': self.current_users > self.plan.max_users,
            'warehouses': self.current_warehouses > self.plan.max_warehouses,
            'products': self.current_products > self.plan.max_products,
            'api_calls': self.api_calls_this_month > self.plan.api_rate_limit,
        }
        return limits
    
    def save(self, *args, **kwargs):
        """Kayıt sırasında otomatik hesaplamalar"""
        # Tutar hesaplama
        if not self.amount:
            if self.billing_cycle == 'yearly' and self.plan.yearly_price:
                self.amount = self.plan.yearly_price
            else:
                self.amount = self.plan.monthly_price
        
        # Dönem sonu hesaplama
        if not self.current_period_end:
            if self.billing_cycle == 'yearly':
                self.current_period_end = self.current_period_start + timedelta(days=365)
            else:
                # Aylık döngü - 30 gün
                self.current_period_end = self.current_period_start + timedelta(days=30)
        
        # Deneme süresi hesaplama (yeni abonelikler için)
        if not self.trial_end_date and self.status == 'trialing':
            self.trial_end_date = self.start_date + timedelta(days=14)  # 14 günlük deneme
        
        super().save(*args, **kwargs)


class SubscriptionUsage(models.Model):
    """
    Abonelik kullanım geçmişi - Aylık kullanım istatistikleri
    """
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='usage_records',
        verbose_name=_('Abonelik')
    )
    
    # Dönem Bilgileri
    period_start = models.DateTimeField(_('Dönem Başlangıcı'))
    period_end = models.DateTimeField(_('Dönem Bitişi'))
    
    # Kullanım İstatistikleri
    api_calls = models.PositiveIntegerField(_('API Çağrısı Sayısı'), default=0)
    marketplace_views = models.PositiveIntegerField(_('Pazaryeri Görüntüleme'), default=0)
    orders_created = models.PositiveIntegerField(_('Oluşturulan Sipariş'), default=0)
    revenue_generated = models.DecimalField(
        _('Oluşturulan Gelir'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Meta Bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Abonelik Kullanımı')
        verbose_name_plural = _('Abonelik Kullanımları')
        ordering = ['-period_start']
        unique_together = ['subscription', 'period_start']
    
    def __str__(self):
        return f"{self.subscription.company.name} - {self.period_start.strftime('%Y-%m')}"