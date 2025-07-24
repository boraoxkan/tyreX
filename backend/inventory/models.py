from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal

class Warehouse(models.Model):
    """
    Depo modeli - Her depo bir şirkete aittir
    """
    name = models.CharField(_('Depo Adı'), max_length=200)
    code = models.CharField(
        _('Depo Kodu'), 
        max_length=20, 
        unique=True,
        help_text=_('Benzersiz depo kodu (örn: IST001, ANK002)')
    )
    
    # Şirket ilişkisi
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='warehouses',
        verbose_name=_('Şirket')
    )
    
    # Lokasyon bilgileri
    address = models.TextField(_('Adres'), blank=True, null=True)
    city = models.CharField(_('Şehir'), max_length=100, blank=True, null=True)
    postal_code = models.CharField(_('Posta Kodu'), max_length=20, blank=True, null=True)
    country = models.CharField(_('Ülke'), max_length=100, default='Türkiye')
    
    # İletişim bilgileri
    phone = models.CharField(_('Telefon'), max_length=20, blank=True, null=True)
    email = models.EmailField(_('E-posta'), blank=True, null=True)
    manager_name = models.CharField(_('Sorumlu Adı'), max_length=100, blank=True, null=True)
    
    # Depo özellikleri
    total_area = models.DecimalField(
        _('Toplam Alan (m²)'), 
        max_digits=10, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    storage_capacity = models.PositiveIntegerField(
        _('Depolama Kapasitesi'), 
        blank=True, 
        null=True,
        help_text=_('Maksimum ürün adedi')
    )
    
    # Depo türü
    WAREHOUSE_TYPES = [
        ('main', _('Ana Depo')),
        ('distribution', _('Dağıtım Merkezi')),
        ('retail', _('Mağaza Deposu')),
        ('virtual', _('Sanal Depo')),
        ('consignment', _('Konsinye Depo')),
    ]
    
    warehouse_type = models.CharField(
        _('Depo Türü'),
        max_length=20,
        choices=WAREHOUSE_TYPES,
        default='main'
    )
    
    # Durum bilgileri
    is_active = models.BooleanField(_('Aktif'), default=True)
    accepts_inbound = models.BooleanField(_('Giriş Kabul Eder'), default=True)
    accepts_outbound = models.BooleanField(_('Çıkış Kabul Eder'), default=True)
    
    # Meta bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Güncellenme Tarihi'), auto_now=True)
    
    class Meta:
        verbose_name = _('Depo')
        verbose_name_plural = _('Depolar')
        ordering = ['company__name', 'name']
    
    def __str__(self):
        return f"{self.company.name} - {self.name} ({self.code})"
    
    def get_total_stock_value(self):
        """Depodaki toplam stok değerini hesaplar"""
        total = Decimal('0.00')
        for stock_item in self.stock_items.all():
            if stock_item.cost_price:
                total += stock_item.quantity * stock_item.cost_price
        return total
    
    def get_total_products(self):
        """Depodaki toplam ürün çeşit sayısını döndürür"""
        return self.stock_items.count()
    
    def get_total_quantity(self):
        """Depodaki toplam ürün adetini döndürür"""
        return sum(item.quantity for item in self.stock_items.all())


class StockItem(models.Model):
    """
    Stok kalemi - Bir ürünün bir depodaki stok bilgileri
    """
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='stock_items',
        verbose_name=_('Ürün')
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='stock_items',
        verbose_name=_('Depo')
    )
    
    # Stok miktarları
    quantity = models.PositiveIntegerField(
        _('Mevcut Miktar'), 
        default=0,
        validators=[MinValueValidator(0)]
    )
    reserved_quantity = models.PositiveIntegerField(
        _('Rezerve Miktar'), 
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Sipariş verilmiş ancak henüz sevk edilmemiş miktar')
    )
    minimum_stock = models.PositiveIntegerField(
        _('Minimum Stok'), 
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Bu seviyenin altına düştüğünde uyarı verilir')
    )
    maximum_stock = models.PositiveIntegerField(
        _('Maksimum Stok'), 
        blank=True, 
        null=True,
        validators=[MinValueValidator(1)],
        help_text=_('Bu seviyenin üzerine çıkmaması önerilen miktar')
    )
    
    # Fiyat bilgileri
    cost_price = models.DecimalField(
        _('Maliyet Fiyatı'), 
        max_digits=12, 
        decimal_places=4, 
        blank=True, 
        null=True,
        help_text=_('Ürünün alış/maliyet fiyatı')
    )
    sale_price = models.DecimalField(
        _('Satış Fiyatı'), 
        max_digits=12, 
        decimal_places=4, 
        blank=True, 
        null=True,
        help_text=_('Toptancı liste fiyatı')
    )
    
    # Lokasyon bilgileri
    location_code = models.CharField(
        _('Lokasyon Kodu'), 
        max_length=50, 
        blank=True, 
        null=True,
        help_text=_('Depo içindeki konum (Raf: A1-B2 gibi)')
    )
    
    # Lot/Parti bilgileri
    lot_number = models.CharField(
        _('Lot/Parti Numarası'), 
        max_length=100, 
        blank=True, 
        null=True
    )
    expiry_date = models.DateField(
        _('Son Kullanma Tarihi'), 
        blank=True, 
        null=True
    )
    
    # Durum bilgileri
    is_active = models.BooleanField(_('Aktif'), default=True)
    is_sellable = models.BooleanField(
        _('Satılabilir'), 
        default=True,
        help_text=_('False ise hasarlı/kusurlu ürün demektir')
    )
    
    # Son hareket bilgileri
    last_inbound_date = models.DateTimeField(
        _('Son Giriş Tarihi'), 
        blank=True, 
        null=True
    )
    last_outbound_date = models.DateTimeField(
        _('Son Çıkış Tarihi'), 
        blank=True, 
        null=True
    )
    last_count_date = models.DateTimeField(
        _('Son Sayım Tarihi'), 
        blank=True, 
        null=True
    )
    
    # Meta bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Güncellenme Tarihi'), auto_now=True)
    
    class Meta:
        verbose_name = _('Stok Kalemi')
        verbose_name_plural = _('Stok Kalemleri')
        unique_together = ['product', 'warehouse', 'lot_number']
        ordering = ['warehouse__name', 'product__name']
        indexes = [
            models.Index(fields=['product', 'warehouse']),
            models.Index(fields=['warehouse', 'quantity']),
            models.Index(fields=['expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.warehouse.name} ({self.quantity} adet)"
    
    def get_available_quantity(self):
        """Satılabilir (rezerve edilmemiş) miktarı döndürür"""
        return max(0, self.quantity - self.reserved_quantity)
    
    def is_low_stock(self):
        """Minimum stok seviyesinin altında mı kontrol eder"""
        return self.quantity <= self.minimum_stock
    
    def is_out_of_stock(self):
        """Stokta yok mu kontrol eder"""
        return self.quantity == 0
    
    def is_overstocked(self):
        """Maksimum stok seviyesinin üzerinde mi kontrol eder"""
        if self.maximum_stock:
            return self.quantity > self.maximum_stock
        return False
    
    def get_stock_status(self):
        """Stok durumunu döndürür"""
        if self.is_out_of_stock():
            return 'out_of_stock'
        elif self.is_low_stock():
            return 'low_stock'
        elif self.is_overstocked():
            return 'overstocked'
        else:
            return 'normal'
    
    def get_stock_status_display(self):
        """Stok durumunu açıklayıcı metin olarak döndürür"""
        status = self.get_stock_status()
        status_map = {
            'out_of_stock': _('Stokta Yok'),
            'low_stock': _('Düşük Stok'),
            'overstocked': _('Fazla Stok'),
            'normal': _('Normal'),
        }
        return status_map.get(status, _('Bilinmiyor'))
    
    def get_total_value(self):
        """Bu stok kaleminin toplam değerini hesaplar"""
        if self.cost_price:
            return self.quantity * self.cost_price
        return Decimal('0.00')
    
    def clean(self):
        """Model doğrulama kuralları"""
        from django.core.exceptions import ValidationError
        
        if self.reserved_quantity > self.quantity:
            raise ValidationError({
                'reserved_quantity': _('Rezerve miktar, mevcut miktardan fazla olamaz.')
            })
        
        if self.maximum_stock and self.minimum_stock >= self.maximum_stock:
            raise ValidationError({
                'minimum_stock': _('Minimum stok, maksimum stoktan küçük olmalıdır.')
            })