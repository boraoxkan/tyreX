from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count
from .models import Warehouse, StockItem

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'code', 
        'company',
        'warehouse_type',
        'city',
        'is_active',
        'get_total_products',
        'get_total_stock',
        'get_stock_value'
    ]
    list_filter = [
        'warehouse_type',
        'is_active',
        'accepts_inbound',
        'accepts_outbound',
        'company__company_type',
        'city'
    ]
    search_fields = [
        'name', 
        'code', 
        'company__name',
        'city',
        'manager_name'
    ]
    ordering = ['company__name', 'name']
    
    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('name', 'code', 'company', 'warehouse_type')
        }),
        ('Lokasyon', {
            'fields': ('address', 'city', 'postal_code', 'country'),
            'classes': ('collapse',)
        }),
        ('İletişim', {
            'fields': ('phone', 'email', 'manager_name'),
            'classes': ('collapse',)
        }),
        ('Özellikler', {
            'fields': ('total_area', 'storage_capacity'),
            'classes': ('collapse',)
        }),
        ('Durum', {
            'fields': ('is_active', 'accepts_inbound', 'accepts_outbound')
        }),
    )
    
    def get_total_products(self, obj):
        """Depodaki toplam ürün çeşit sayısını gösterir"""
        return obj.stock_items.count()
    get_total_products.short_description = 'Ürün Çeşidi'
    
    def get_total_stock(self, obj):
        """Depodaki toplam ürün adetini gösterir"""
        total = obj.stock_items.aggregate(total=Sum('quantity'))['total'] or 0
        return format_html('<strong>{}</strong> adet', total)
    get_total_stock.short_description = 'Toplam Adet'
    
    def get_stock_value(self, obj):
        """Depodaki toplam stok değerini gösterir"""
        total_value = sum(
            (item.quantity * item.cost_price) if item.cost_price else 0 
            for item in obj.stock_items.all()
        )
        if total_value > 0:
            formatted_value = "{:,.2f}".format(float(total_value))
            return format_html('<span style="color: green;">₺{}</span>', formatted_value)
        return format_html('<span style="color: gray;">-</span>')
    get_stock_value.short_description = 'Stok Değeri'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('company').prefetch_related('stock_items')


@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = [
        'product',
        'warehouse',
        'get_company',
        'quantity',
        'reserved_quantity',
        'get_available_quantity',
        'get_stock_status_badge',
        'sale_price',
        'get_total_value',
        'last_inbound_date'
    ]
    list_filter = [
        'warehouse__company',
        'warehouse',
        'is_active',
        'is_sellable',
        'product__category',
        'last_inbound_date',
        'expiry_date'
    ]
    search_fields = [
        'product__name',
        'product__sku',
        'product__barcode',
        'warehouse__name',
        'warehouse__code',
        'lot_number',
        'location_code'
    ]
    ordering = ['-updated_at']
    
    fieldsets = (
        ('Ürün ve Depo', {
            'fields': ('product', 'warehouse')
        }),
        ('Stok Miktarları', {
            'fields': (
                ('quantity', 'reserved_quantity'),
                ('minimum_stock', 'maximum_stock')
            )
        }),
        ('Fiyat Bilgileri', {
            'fields': ('cost_price', 'sale_price'),
            'classes': ('collapse',)
        }),
        ('Lokasyon ve Lot', {
            'fields': ('location_code', 'lot_number', 'expiry_date'),
            'classes': ('collapse',)
        }),
        ('Durum', {
            'fields': ('is_active', 'is_sellable')
        }),
        ('Son Hareketler', {
            'fields': ('last_inbound_date', 'last_outbound_date', 'last_count_date'),
            'classes': ('collapse',)
        }),
    )
    
    def get_company(self, obj):
        """Deponun ait olduğu şirketi gösterir"""
        return obj.warehouse.company.name
    get_company.short_description = 'Şirket'
    get_company.admin_order_field = 'warehouse__company__name'
    
    def get_available_quantity(self, obj):
        """Satılabilir miktarı gösterir"""
        available = obj.get_available_quantity()
        if available < obj.quantity:
            return format_html(
                '<span style="color: orange;" title="Rezerve: {}">{}</span>',
                obj.reserved_quantity,
                available
            )
        return available
    get_available_quantity.short_description = 'Mevcut'
    
    def get_stock_status_badge(self, obj):
        """Stok durumunu renkli badge olarak gösterir"""
        status = obj.get_stock_status()
        status_colors = {
            'out_of_stock': '#dc3545',  # Kırmızı
            'low_stock': '#fd7e14',     # Turuncu
            'overstocked': '#6f42c1',   # Mor
            'normal': '#198754'         # Yeşil
        }
        
        color = status_colors.get(status, '#6c757d')
        display_text = obj.get_stock_status_display()
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            display_text
        )
    get_stock_status_badge.short_description = 'Durum'
    
    def get_total_value(self, obj):
        """Toplam değeri gösterir"""
        total = obj.get_total_value()
        if total > 0:
            formatted_value = "{:,.2f}".format(float(total))
            return format_html('₺{}', formatted_value)
        return '-'
    get_total_value.short_description = 'Toplam Değer'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'product',
            'product__category',
            'warehouse',
            'warehouse__company'
        )
    
    # Toplu işlemler
    actions = ['mark_as_active', 'mark_as_inactive', 'reset_reserved_quantity']
    
    def mark_as_active(self, request, queryset):
        """Seçili stok kalemlerini aktif yapar"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request, 
            f'{updated} stok kalemi aktif duruma getirildi.'
        )
    mark_as_active.short_description = "Seçili kalemleri aktif yap"
    
    def mark_as_inactive(self, request, queryset):
        """Seçili stok kalemlerini pasif yapar"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request, 
            f'{updated} stok kalemi pasif duruma getirildi.'
        )
    mark_as_inactive.short_description = "Seçili kalemleri pasif yap"
    
    def reset_reserved_quantity(self, request, queryset):
        """Rezerve miktarları sıfırlar"""
        updated = queryset.update(reserved_quantity=0)
        self.message_user(
            request, 
            f'{updated} stok kaleminin rezerve miktarı sıfırlandı.'
        )
    reset_reserved_quantity.short_description = "Rezerve miktarları sıfırla"


# Eğer StockItem'ları Warehouse admin sayfasında da göstermek istersek
class StockItemInline(admin.TabularInline):
    """Depo admin sayfasında stok kalemlerini gösterir"""
    model = StockItem
    extra = 0
    fields = [
        'product', 
        'quantity', 
        'reserved_quantity',
        'minimum_stock',
        'sale_price',
        'is_active'
    ]
    readonly_fields = ['product']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product')

# StockItemInline'ı WarehouseAdmin'e eklemek için:
# WarehouseAdmin.inlines = [StockItemInline]