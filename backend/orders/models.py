# backend/orders/models.py
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid


class Order(models.Model):
    """
    Sipariş modeli - Perakendeciden toptancıya siparişler
    """
    STATUS_CHOICES = [
        ('draft', _('Taslak')),
        ('pending', _('Beklemede')),
        ('confirmed', _('Onaylandı')),
        ('processing', _('İşleniyor')),
        ('shipped', _('Kargoya Verildi')),
        ('delivered', _('Teslim Edildi')),
        ('canceled', _('İptal Edildi')),
        ('rejected', _('Reddedildi')),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', _('Ödeme Bekliyor')),
        ('paid', _('Ödendi')),
        ('partially_paid', _('Kısmi Ödendi')),
        ('failed', _('Ödeme Başarısız')),
        ('refunded', _('İade Edildi')),
    ]
    
    # Temel bilgiler
    order_number = models.CharField(
        _('Sipariş Numarası'),
        max_length=50,
        unique=True,
        help_text=_('Benzersiz sipariş numarası')
    )
    uuid = models.UUIDField(
        _('UUID'),
        default=uuid.uuid4,
        editable=False,
        unique=True
    )
    
    # İlişkiler
    retailer = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='orders_placed',
        verbose_name=_('Perakendeci'),
        limit_choices_to={'company_type__in': ['retailer', 'both']}
    )
    wholesaler = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='orders_received',
        verbose_name=_('Toptancı'),
        limit_choices_to={'company_type__in': ['wholesaler', 'both']}
    )
    retailer_user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name=_('Sipariş Veren Kullanıcı')
    )
    
    # Sipariş durumu
    status = models.CharField(
        _('Sipariş Durumu'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    payment_status = models.CharField(
        _('Ödeme Durumu'),
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending'
    )
    
    # Fiyat bilgileri
    subtotal = models.DecimalField(
        _('Ara Toplam'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    tax_amount = models.DecimalField(
        _('KDV Tutarı'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    shipping_cost = models.DecimalField(
        _('Kargo Ücreti'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    discount_amount = models.DecimalField(
        _('İndirim Tutarı'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total_amount = models.DecimalField(
        _('Toplam Tutar'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    currency = models.CharField(
        _('Para Birimi'),
        max_length=3,
        default='TRY'
    )
    
    # Tyrex komisyonu
    tyrex_commission_rate = models.DecimalField(
        _('Tyrex Komisyon Oranı (%)'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('2.50'),
        help_text=_('Sipariş anındaki komisyon oranı')
    )
    tyrex_commission_amount = models.DecimalField(
        _('Tyrex Komisyon Tutarı'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Teslimat bilgileri
    delivery_address = models.TextField(
        _('Teslimat Adresi'),
        blank=True,
        null=True
    )
    delivery_contact = models.CharField(
        _('Teslimat İletişim'),
        max_length=200,
        blank=True,
        null=True
    )
    delivery_phone = models.CharField(
        _('Teslimat Telefonu'),
        max_length=20,
        blank=True,
        null=True
    )
    
    # Ödeme bilgileri
    payment_terms_days = models.PositiveIntegerField(
        _('Ödeme Vadesi (Gün)'),
        default=30
    )
    due_date = models.DateTimeField(
        _('Ödeme Vadesi'),
        blank=True,
        null=True
    )
    
    # Notlar
    notes = models.TextField(
        _('Sipariş Notları'),
        blank=True,
        null=True
    )
    internal_notes = models.TextField(
        _('İç Notlar'),
        blank=True,
        null=True,
        help_text=_('Sadece sistem kullanıcıları tarafından görülür')
    )
    
    # Tarihler
    order_date = models.DateTimeField(
        _('Sipariş Tarihi'),
        auto_now_add=True
    )
    confirmed_at = models.DateTimeField(
        _('Onay Tarihi'),
        blank=True,
        null=True
    )
    shipped_at = models.DateTimeField(
        _('Kargo Tarihi'),
        blank=True,
        null=True
    )
    delivered_at = models.DateTimeField(
        _('Teslimat Tarihi'),
        blank=True,
        null=True
    )
    canceled_at = models.DateTimeField(
        _('İptal Tarihi'),
        blank=True,
        null=True
    )
    
    # Meta bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Güncellenme Tarihi'), auto_now=True)
    
    class Meta:
        verbose_name = _('Sipariş')
        verbose_name_plural = _('Siparişler')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['retailer', 'status']),
            models.Index(fields=['wholesaler', 'status']),
            models.Index(fields=['order_date']),
            models.Index(fields=['status', 'payment_status']),
        ]
    
    def __str__(self):
        return f"Sipariş #{self.order_number} - {self.retailer.name} → {self.wholesaler.name}"
    
    def save(self, *args, **kwargs):
        """Sipariş kaydederken otomatik hesaplamalar"""
        # Sipariş numarası oluştur
        if not self.order_number:
            from django.utils import timezone
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            self.order_number = f"ORD-{timestamp}-{self.retailer.id}"
        
        # Order date'i set et (eğer yoksa)
        if not self.order_date:
            from django.utils import timezone
            self.order_date = timezone.now()
        
        # Tyrex komisyon tutarını hesapla
        if self.subtotal and self.tyrex_commission_rate:
            self.tyrex_commission_amount = (
                self.subtotal * self.tyrex_commission_rate / 100
            ).quantize(Decimal('0.01'))
        
        # Toplam tutarı hesapla
        self.total_amount = (
            self.subtotal + 
            self.tax_amount + 
            self.shipping_cost - 
            self.discount_amount
        ).quantize(Decimal('0.01'))
        
        # Ödeme vadesi hesapla (order_date set edildikten sonra)
        if not self.due_date and self.payment_terms_days and self.order_date:
            from datetime import timedelta
            self.due_date = self.order_date + timedelta(days=self.payment_terms_days)
        
        super().save(*args, **kwargs)
    
    def get_total_items(self):
        """Toplam ürün adeti"""
        return sum(item.quantity for item in self.items.all())
    
    def get_total_unique_products(self):
        """Farklı ürün sayısı"""
        return self.items.count()
    
    def can_be_canceled(self):
        """İptal edilebilir mi?"""
        return self.status in ['draft', 'pending', 'confirmed']
    
    def can_be_confirmed(self):
        """Onaylanabilir mi?"""
        return self.status in ['draft', 'pending']


class OrderItem(models.Model):
    """
    Sipariş kalemi - Her ürün için ayrı kayıt
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('Sipariş')
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='order_items',
        verbose_name=_('Ürün')
    )
    warehouse = models.ForeignKey(
        'inventory.Warehouse',
        on_delete=models.CASCADE,
        related_name='order_items',
        verbose_name=_('Kaynak Depo'),
        help_text=_('Ürünün alındığı depo')
    )
    stock_item = models.ForeignKey(
        'inventory.StockItem',
        on_delete=models.CASCADE,
        related_name='order_items',
        verbose_name=_('Stok Kalemi'),
        help_text=_('Referans stok kalemi')
    )
    
    # Miktar ve fiyat bilgileri
    quantity = models.PositiveIntegerField(
        _('Miktar'),
        validators=[MinValueValidator(1)]
    )
    unit_price = models.DecimalField(
        _('Birim Fiyat (Satış)'),
        max_digits=12,
        decimal_places=4,
        validators=[MinValueValidator(Decimal('0.0001'))],
        help_text=_('Perakendeciye satılan fiyat (dinamik hesaplanmış)')
    )
    wholesaler_reference_price = models.DecimalField(
        _('Toptancı Liste Fiyatı'),
        max_digits=12,
        decimal_places=4,
        validators=[MinValueValidator(Decimal('0.0001'))],
        help_text=_('Toptancının orijinal liste fiyatı (analiz için)')
    )
    total_price = models.DecimalField(
        _('Toplam Fiyat'),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # İndirim bilgileri
    discount_percentage = models.DecimalField(
        _('İndirim Yüzdesi'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    discount_amount = models.DecimalField(
        _('İndirim Tutarı'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Ürün bilgileri (snapshot)
    product_name = models.CharField(
        _('Ürün Adı (Anlık)'),
        max_length=200,
        help_text=_('Sipariş anındaki ürün adı')
    )
    product_sku = models.CharField(
        _('Ürün Kodu (Anlık)'),
        max_length=100,
        help_text=_('Sipariş anındaki ürün kodu')
    )
    product_brand = models.CharField(
        _('Marka (Anlık)'),
        max_length=100,
        blank=True,
        null=True
    )
    
    # Durum bilgileri
    is_canceled = models.BooleanField(
        _('İptal Edildi'),
        default=False
    )
    canceled_at = models.DateTimeField(
        _('İptal Tarihi'),
        blank=True,
        null=True
    )
    cancel_reason = models.CharField(
        _('İptal Nedeni'),
        max_length=200,
        blank=True,
        null=True
    )
    
    # Meta bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Güncellenme Tarihi'), auto_now=True)
    
    class Meta:
        verbose_name = _('Sipariş Kalemi')
        verbose_name_plural = _('Sipariş Kalemleri')
        ordering = ['order', 'product__name']
        unique_together = ['order', 'product', 'warehouse']
        indexes = [
            models.Index(fields=['order', 'product']),
            models.Index(fields=['product', 'quantity']),
        ]
    
    def __str__(self):
        return f"{self.order.order_number} - {self.product_name} ({self.quantity} adet)"
    
    def save(self, *args, **kwargs):
        """Sipariş kalemi kaydederken otomatik hesaplamalar"""
        # Ürün bilgilerini snapshot olarak kaydet
        if self.product:
            self.product_name = self.product.name
            self.product_sku = self.product.sku
            self.product_brand = self.product.brand or ''
        
        # Toplam fiyatı hesapla
        if self.quantity and self.unit_price:
            self.total_price = (
                (self.quantity * self.unit_price) - self.discount_amount
            ).quantize(Decimal('0.01'))
        
        super().save(*args, **kwargs)
    
    def get_discount_percentage_calculated(self):
        """Gerçek indirim yüzdesini hesapla"""
        if self.wholesaler_reference_price and self.unit_price:
            if self.wholesaler_reference_price > self.unit_price:
                discount = (
                    (self.wholesaler_reference_price - self.unit_price) / 
                    self.wholesaler_reference_price * 100
                )
                return discount.quantize(Decimal('0.1'))
        return Decimal('0.0')
    
    def get_total_discount_amount(self):
        """Toplam indirim tutarını hesapla"""
        if self.wholesaler_reference_price and self.unit_price and self.quantity:
            price_diff = self.wholesaler_reference_price - self.unit_price
            if price_diff > 0:
                return (price_diff * self.quantity).quantize(Decimal('0.01'))
        return Decimal('0.00')


class OrderStatusHistory(models.Model):
    """
    Sipariş durum değişiklik geçmişi
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name=_('Sipariş')
    )
    old_status = models.CharField(
        _('Eski Durum'),
        max_length=20,
        choices=Order.STATUS_CHOICES,
        blank=True,
        null=True
    )
    new_status = models.CharField(
        _('Yeni Durum'),
        max_length=20,
        choices=Order.STATUS_CHOICES
    )
    changed_by = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        verbose_name=_('Değiştiren Kullanıcı'),
        blank=True,
        null=True
    )
    change_reason = models.CharField(
        _('Değişiklik Nedeni'),
        max_length=200,
        blank=True,
        null=True
    )
    notes = models.TextField(
        _('Notlar'),
        blank=True,
        null=True
    )
    changed_at = models.DateTimeField(
        _('Değişiklik Tarihi'),
        auto_now_add=True
    )
    
    class Meta:
        verbose_name = _('Sipariş Durum Geçmişi')
        verbose_name_plural = _('Sipariş Durum Geçmişleri')
        ordering = ['-changed_at']
    
    def __str__(self):
        return f"{self.order.order_number} - {self.old_status} → {self.new_status}"