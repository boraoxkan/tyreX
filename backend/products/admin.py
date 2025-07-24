from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Attribute, Product, ProductAttributeValue

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = [
        'name', 
        'get_full_path', 
        'parent', 
        'sort_order', 
        'is_active',
        'get_product_count'
    ]
    list_filter = ['is_active', 'parent']
    search_fields = ['name', 'description']
    ordering = ['sort_order', 'name']
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('name', 'slug', 'description', 'parent')
        }),
        ('Görüntüleme', {
            'fields': ('sort_order', 'is_active')
        }),
    )
    
    def get_product_count(self, obj):
        """Kategorideki ürün sayısını gösterir"""
        return obj.products.count()
    get_product_count.short_description = 'Ürün Sayısı'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('parent').prefetch_related('products')


@admin.register(Attribute)
class AttributeAdmin(admin.ModelAdmin):
    list_display = [
        'name', 
        'attribute_type', 
        'unit',
        'is_required', 
        'is_active', 
        'sort_order',
        'get_category_count'
    ]
    list_filter = ['attribute_type', 'is_required', 'is_active']
    search_fields = ['name']
    ordering = ['sort_order', 'name']
    filter_horizontal = ['categories']
    
    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('name', 'attribute_type', 'unit')
        }),
        ('Seçenekler', {
            'fields': ('choices',),
            'description': 'Sadece "Seçenekli" tip için gerekli. Her satıra bir seçenek yazın.'
        }),
        ('Ayarlar', {
            'fields': ('categories', 'is_required', 'is_active', 'sort_order')
        }),
    )
    
    def get_category_count(self, obj):
        """Bu özelliği kullanan kategori sayısını gösterir"""
        return obj.categories.count()
    get_category_count.short_description = 'Kategori Sayısı'
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        
        # JavaScript ile choices alanını sadece choice tipinde göster
        if 'choices' in form.base_fields:
            form.base_fields['choices'].help_text = (
                'Sadece "Seçenekli" tip için gerekli. Her satıra bir seçenek yazın.'
            )
        
        return form


class ProductAttributeValueInline(admin.TabularInline):
    """Ürün özellik değerleri için inline admin"""
    model = ProductAttributeValue
    extra = 0
    fields = ['attribute', 'get_value_field']
    readonly_fields = ['get_value_field']
    
    def get_value_field(self, obj):
        """Özellik tipine göre uygun alan gösterir"""
        if obj.attribute:
            if obj.attribute.attribute_type in ['text', 'choice', 'color', 'size']:
                return obj.value_text or ''
            elif obj.attribute.attribute_type == 'number':
                if obj.value_number is not None:
                    unit = f" {obj.attribute.unit}" if obj.attribute.unit else ""
                    return f"{obj.value_number}{unit}"
                return ''
            elif obj.attribute.attribute_type == 'boolean':
                if obj.value_boolean is not None:
                    return 'Evet' if obj.value_boolean else 'Hayır'
                return ''
        return ''
    get_value_field.short_description = 'Değer'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name', 
        'sku', 
        'brand',
        'category', 
        'is_active',
        'get_stock_info',
        'created_at'
    ]
    list_filter = [
        'is_active', 
        'is_digital', 
        'requires_shipping',
        'category',
        'brand',
        'created_at'
    ]
    search_fields = ['name', 'sku', 'barcode', 'brand', 'model']
    ordering = ['-created_at']
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ['additional_categories']
    inlines = [ProductAttributeValueInline]
    
    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('name', 'slug', 'sku', 'barcode')
        }),
        ('Açıklamalar', {
            'fields': ('short_description', 'description'),
            'classes': ('collapse',)
        }),
        ('Kategoriler', {
            'fields': ('category', 'additional_categories')
        }),
        ('Ürün Detayları', {
            'fields': ('brand', 'model'),
            'classes': ('collapse',)
        }),
        ('Durum', {
            'fields': ('is_active', 'is_digital', 'requires_shipping')
        }),
        ('Fiziksel Özellikler', {
            'fields': (
                'weight', 
                ('dimensions_length', 'dimensions_width', 'dimensions_height')
            ),
            'classes': ('collapse',)
        }),
    )
    
    def get_stock_info(self, obj):
        """Ürünün stok bilgilerini gösterir"""
        total_stock = sum(stock.quantity for stock in obj.stock_items.all())
        warehouse_count = obj.stock_items.values('warehouse').distinct().count()
        
        if total_stock > 0:
            return format_html(
                '<span style="color: green;">{} adet ({} depo)</span>',
                total_stock,
                warehouse_count
            )
        else:
            return format_html('<span style="color: red;">Stok yok</span>')
    get_stock_info.short_description = 'Stok Durumu'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'category'
        ).prefetch_related(
            'additional_categories',
            'stock_items__warehouse'
        )


@admin.register(ProductAttributeValue)
class ProductAttributeValueAdmin(admin.ModelAdmin):
    list_display = [
        'product', 
        'attribute', 
        'get_display_value',
        'get_attribute_type'
    ]
    list_filter = [
        'attribute__attribute_type',
        'attribute__name',
        'product__category'
    ]
    search_fields = [
        'product__name', 
        'product__sku',
        'attribute__name'
    ]
    ordering = ['product__name', 'attribute__sort_order']
    
    def get_display_value(self, obj):
        """Değeri formatlanmış şekilde gösterir"""
        return obj.get_value()
    get_display_value.short_description = 'Değer'
    
    def get_attribute_type(self, obj):
        """Özellik tipini gösterir"""
        return obj.attribute.get_attribute_type_display()
    get_attribute_type.short_description = 'Özellik Türü'
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        
        # Özellik seçimi yapıldığında uygun değer alanlarını göster
        # Bu JavaScript ile yapılacak, şimdilik sadece help text ekleyelim
        form.base_fields['value_text'].help_text = 'Metin, Seçenekli, Renk ve Beden özellikleri için'
        form.base_fields['value_number'].help_text = 'Sayı özellikleri için'
        form.base_fields['value_boolean'].help_text = 'Evet/Hayır özellikleri için'
        
        return form