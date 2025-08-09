from django.db import models
from django.utils.translation import gettext_lazy as _

class Company(models.Model):
    """
    Şirket modeli - Hem toptancıları hem perakendecileri tutar
    """
    COMPANY_TYPES = [
        ('retailer', _('Perakendeci')),
        ('wholesaler', _('Toptancı')),
        ('both', _('Hem Perakendeci Hem Toptancı')),
    ]
    
    name = models.CharField(_('Şirket Adı'), max_length=200)
    company_type = models.CharField(
        _('Şirket Türü'), 
        max_length=20, 
        choices=COMPANY_TYPES
    )
    is_managed_by_tyrex = models.BooleanField(
        _('Tyrex Tarafından Yönetiliyor mu?'), 
        default=False,
        help_text=_('Bu şirket Tyrex platformu üzerinden yönetiliyor mu?')
    )
    
    # İletişim Bilgileri
    email = models.EmailField(_('E-posta'), blank=True, null=True)
    phone = models.CharField(_('Telefon'), max_length=20, blank=True, null=True)
    address = models.TextField(_('Adres'), blank=True, null=True)
    
    # Meta Bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Güncellenme Tarihi'), auto_now=True)
    is_active = models.BooleanField(_('Aktif'), default=True)
    
    class Meta:
        verbose_name = _('Şirket')
        verbose_name_plural = _('Şirketler')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_company_type_display()})"
    
    def is_retailer(self):
        """Perakendeci mi kontrol eder"""
        return self.company_type in ['retailer', 'both']
    
    def is_wholesaler(self):
        """Toptancı mı kontrol eder"""
        return self.company_type in ['wholesaler', 'both']


class RetailerWholesaler(models.Model):
    """
    Perakendeci-Toptancı ilişki tablosu
    Bu tablo hangi perakendecinin hangi toptancılarla çalıştığını tutar
    """
    retailer = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='wholesaler_relationships',
        verbose_name=_('Perakendeci'),
        limit_choices_to={'company_type__in': ['retailer', 'both']}
    )
    wholesaler = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='retailer_relationships',
        verbose_name=_('Toptancı'),
        limit_choices_to={'company_type__in': ['wholesaler', 'both']}
    )
    
    # İlişki Detayları
    start_date = models.DateField(_('İlişki Başlangıç Tarihi'), auto_now_add=True)
    is_active = models.BooleanField(_('Aktif İlişki'), default=True)
    notes = models.TextField(_('Notlar'), blank=True, null=True)
    
    # Ticari Koşullar
    credit_limit = models.DecimalField(
        _('Kredi Limiti'), 
        max_digits=12, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    payment_terms_days = models.PositiveIntegerField(
        _('Ödeme Vadesi (Gün)'), 
        default=30
    )
    discount_rate = models.DecimalField(
        _('İskonto Oranı'),
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text=_('Bu toptancıdan alınan ürünlerde uygulanacak iskonto oranı (örneğin, 5.00 için %5)')
    )
    
    class Meta:
        verbose_name = _('Perakendeci-Toptancı İlişkisi')
        verbose_name_plural = _('Perakendeci-Toptancı İlişkileri')
        unique_together = ['retailer', 'wholesaler']
        ordering = ['retailer__name', 'wholesaler__name']
    
    def __str__(self):
        return f"{self.retailer.name} ↔ {self.wholesaler.name}"
    
    def clean(self):
        """Model doğrulama kuralları"""
        from django.core.exceptions import ValidationError
        
        if self.retailer == self.wholesaler:
            raise ValidationError(_('Perakendeci ve toptancı aynı şirket olamaz.'))
        
        if not self.retailer.is_retailer():
            raise ValidationError(_('Seçilen şirket perakendeci değil.'))
            
        if not self.wholesaler.is_wholesaler():
            raise ValidationError(_('Seçilen şirket toptancı değil.'))