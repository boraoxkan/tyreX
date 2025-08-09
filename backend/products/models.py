from django.db import models
from django.utils.translation import gettext_lazy as _

class Category(models.Model):
    """
    Ürün kategorileri - Hiyerarşik yapı destekler
    """
    name = models.CharField(_('Kategori Adı'), max_length=100)
    slug = models.SlugField(_('URL Adı'), unique=True)
    description = models.TextField(_('Açıklama'), blank=True, null=True)
    
    # Hiyerarşi için parent ilişkisi
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='children',
        verbose_name=_('Üst Kategori')
    )
    
    # Sıralama ve görüntüleme
    sort_order = models.PositiveIntegerField(_('Sıra'), default=0)
    is_active = models.BooleanField(_('Aktif'), default=True)
    
    # Meta bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Güncellenme Tarihi'), auto_now=True)
    
    class Meta:
        verbose_name = _('Kategori')
        verbose_name_plural = _('Kategoriler')
        ordering = ['sort_order', 'name']
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name
    
    def get_full_path(self):
        """Kategorinin tam yolunu döndürür"""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return " > ".join(path)


class Attribute(models.Model):
    """
    Ürün özellikleri (Renk, Beden, Materyal vb.)
    """
    ATTRIBUTE_TYPES = [
        ('text', _('Metin')),
        ('number', _('Sayı')),
        ('boolean', _('Evet/Hayır')),
        ('choice', _('Seçenekli')),
        ('color', _('Renk')),
        ('size', _('Beden')),
    ]
    
    name = models.CharField(_('Özellik Adı'), max_length=100)
    attribute_type = models.CharField(
        _('Özellik Türü'), 
        max_length=20, 
        choices=ATTRIBUTE_TYPES
    )
    unit = models.CharField(
        _('Birim'), 
        max_length=20, 
        blank=True, 
        null=True,
        help_text=_('Örn: cm, kg, adet')
    )
    
    # Seçenekli özellikler için
    choices = models.TextField(
        _('Seçenekler'),
        blank=True,
        null=True,
        help_text=_('Her satıra bir seçenek yazın')
    )
    
    # Kategori bağlantısı
    categories = models.ManyToManyField(
        Category,
        blank=True,
        verbose_name=_('Kategoriler'),
        help_text=_('Bu özelliğin hangi kategorilerde kullanılacağı')
    )
    
    is_required = models.BooleanField(_('Zorunlu'), default=False)
    is_active = models.BooleanField(_('Aktif'), default=True)
    sort_order = models.PositiveIntegerField(_('Sıra'), default=0)
    
    class Meta:
        verbose_name = _('Özellik')
        verbose_name_plural = _('Özellikler')
        ordering = ['sort_order', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_attribute_type_display()})"
    
    def get_choices_list(self):
        """Seçenekleri liste olarak döndürür"""
        if self.choices:
            return [choice.strip() for choice in self.choices.split('\n') if choice.strip()]
        return []


class Product(models.Model):
    """
    Ana ürün modeli
    """
    name = models.CharField(_('Ürün Adı'), max_length=200)
    slug = models.SlugField(_('URL Adı'), unique=True)
    description = models.TextField(_('Açıklama'), blank=True, null=True)
    short_description = models.CharField(
        _('Kısa Açıklama'), 
        max_length=500, 
        blank=True, 
        null=True
    )
    
    # Kategoriler
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
        verbose_name=_('Ana Kategori')
    )
    additional_categories = models.ManyToManyField(
        Category,
        blank=True,
        related_name='additional_products',
        verbose_name=_('Ek Kategoriler')
    )
    
    # Ürün kodları
    sku = models.CharField(
        _('Stok Kodu (SKU)'), 
        max_length=100, 
        unique=True,
        help_text=_('Benzersiz ürün kodu')
    )
    barcode = models.CharField(
        _('Barkod'), 
        max_length=50, 
        blank=True, 
        null=True,
        unique=True
    )
    
    # Temel ürün bilgileri
    brand = models.CharField(_('Marka'), max_length=100, blank=True, null=True)
    model = models.CharField(_('Model'), max_length=100, blank=True, null=True)
    
    # Lastik özellikleri
    tire_width = models.CharField(
        _('Lastik Genişliği'), 
        max_length=10, 
        blank=True, 
        null=True,
        help_text=_('Örn: 225, 205, 195')
    )
    tire_aspect_ratio = models.CharField(
        _('Lastik Yan Oranı'), 
        max_length=10, 
        blank=True, 
        null=True,
        help_text=_('Örn: 45, 55, 65')
    )
    tire_diameter = models.CharField(
        _('Lastik Çapı'), 
        max_length=10, 
        blank=True, 
        null=True,
        help_text=_('Örn: 17, 16, 15')
    )
    
    # Akü özellikleri
    battery_ampere = models.CharField(
        _('Akü Amperesi'), 
        max_length=10, 
        blank=True, 
        null=True,
        help_text=_('Örn: 60Ah, 74Ah, 100Ah')
    )
    battery_voltage = models.CharField(
        _('Akü Voltajı'), 
        max_length=10, 
        blank=True, 
        null=True,
        help_text=_('Örn: 12V, 24V')
    )
    
    # Jant özellikleri
    rim_size = models.CharField(
        _('Jant Boyutu'), 
        max_length=10, 
        blank=True, 
        null=True,
        help_text=_('Örn: 17", 18", 19"')
    )
    rim_bolt_pattern = models.CharField(
        _('Jant Bijon Deseni'), 
        max_length=20, 
        blank=True, 
        null=True,
        help_text=_('Örn: 5x112, 4x100')
    )
    
    # Durum bilgileri
    is_active = models.BooleanField(_('Aktif'), default=True)
    is_digital = models.BooleanField(_('Dijital Ürün'), default=False)
    requires_shipping = models.BooleanField(_('Kargo Gerektirir'), default=True)
    
    # Boyut ve ağırlık bilgileri
    weight = models.DecimalField(
        _('Ağırlık (kg)'), 
        max_digits=8, 
        decimal_places=3, 
        blank=True, 
        null=True
    )
    dimensions_length = models.DecimalField(
        _('Uzunluk (cm)'), 
        max_digits=8, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    dimensions_width = models.DecimalField(
        _('Genişlik (cm)'), 
        max_digits=8, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    dimensions_height = models.DecimalField(
        _('Yükseklik (cm)'), 
        max_digits=8, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    
    # Meta bilgiler
    created_at = models.DateTimeField(_('Oluşturulma Tarihi'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Güncellenme Tarihi'), auto_now=True)
    
    class Meta:
        verbose_name = _('Ürün')
        verbose_name_plural = _('Ürünler')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.sku})"
    
    def get_main_image(self):
        """Ana ürün resmini döndürür (gelecekte image modeli eklendiğinde)"""
        # TODO: ProductImage modeli eklendiğinde implement edilecek
        return None
    
    def get_tire_size(self):
        """Lastik ebatını 225/45/17 formatında döndürür"""
        if self.tire_width and self.tire_aspect_ratio and self.tire_diameter:
            return f"{self.tire_width}/{self.tire_aspect_ratio}/{self.tire_diameter}"
        return None
    
    def get_category_path(self):
        """Kategori yolunu döndürür"""
        if self.category:
            return self.category.get_full_path()
        return ""


class ProductAttributeValue(models.Model):
    """
    Ürünlerin özellik değerleri
    """
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='attribute_values',
        verbose_name=_('Ürün')
    )
    attribute = models.ForeignKey(
        Attribute,
        on_delete=models.CASCADE,
        related_name='product_values',
        verbose_name=_('Özellik')
    )
    
    # Farklı veri tipleri için alanlar
    value_text = models.TextField(_('Metin Değeri'), blank=True, null=True)
    value_number = models.DecimalField(
        _('Sayı Değeri'), 
        max_digits=12, 
        decimal_places=4, 
        blank=True, 
        null=True
    )
    value_boolean = models.BooleanField(
        _('Boolean Değeri'), 
        blank=True, 
        null=True
    )
    
    class Meta:
        verbose_name = _('Ürün Özellik Değeri')
        verbose_name_plural = _('Ürün Özellik Değerleri')
        unique_together = ['product', 'attribute']
        ordering = ['attribute__sort_order', 'attribute__name']
    
    def __str__(self):
        return f"{self.product.name} - {self.attribute.name}: {self.get_value()}"
    
    def get_value(self):
        """Özellik tipine göre doğru değeri döndürür"""
        if self.attribute.attribute_type == 'text' or self.attribute.attribute_type == 'choice':
            return self.value_text or ''
        elif self.attribute.attribute_type == 'number':
            if self.value_number is not None:
                unit = f" {self.attribute.unit}" if self.attribute.unit else ""
                return f"{self.value_number}{unit}"
            return ''
        elif self.attribute.attribute_type == 'boolean':
            if self.value_boolean is not None:
                return _('Evet') if self.value_boolean else _('Hayır')
            return ''
        elif self.attribute.attribute_type in ['color', 'size']:
            return self.value_text or ''
        return ''
    
    def set_value(self, value):
        """Özellik tipine göre doğru alana değer atar"""
        # Önce tüm değerleri sıfırla
        self.value_text = None
        self.value_number = None
        self.value_boolean = None
        
        if self.attribute.attribute_type in ['text', 'choice', 'color', 'size']:
            self.value_text = str(value) if value is not None else None
        elif self.attribute.attribute_type == 'number':
            try:
                self.value_number = float(value) if value not in [None, ''] else None
            except (ValueError, TypeError):
                self.value_number = None
        elif self.attribute.attribute_type == 'boolean':
            if isinstance(value, bool):
                self.value_boolean = value
            elif isinstance(value, str):
                self.value_boolean = value.lower() in ['true', '1', 'yes', 'evet', 'on']
            else:
                self.value_boolean = bool(value) if value is not None else None