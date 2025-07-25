# backend/orders/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    """Sipariş kalemleri için inline admin"""
    model = OrderItem
    extra = 0
    fields = [
        'product', 'product_name', 'quantity', 
        'unit_price', 'wholesaler_reference_price', 'total_price',
        'warehouse', 'is_canceled'
    ]
    readonly_fields = ['product_name', 'total_price']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'product', 'warehouse'
        )


class OrderStatusHistoryInline(admin.TabularInline):
    """Sipariş durum geçmişi için inline admin"""
    model = OrderStatusHistory
    extra = 0
    fields = ['old_status', 'new_status', 'changed_by', 'change_reason', 'changed_at']
    readonly_fields = ['changed_at']
    ordering = ['-changed_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('changed_by')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number',
        'get_retailer_link',
        'get_wholesaler_link',
        'get_status_badge',
        'get_payment_status_badge',
        'total_amount',
        'get_total_items',
        'order_date',
        'get_days_since_order'
    ]
    list_filter = [
        'status',
        'payment_status',
        'order_date',
        'retailer',
        'wholesaler',
        'tyrex_commission_rate'
    ]
    search_fields = [
        'order_number',
        'retailer__name',
        'wholesaler__name',
        'retailer_user__email',
        'notes'
    ]
    ordering = ['-created_at']
    date_hierarchy = 'order_date'
    
    fieldsets = (
        ('Sipariş Bilgileri', {
            'fields': (
                'order_number', 'uuid', 'status', 'payment_status'
            )
        }),
        ('Taraflar', {
            'fields': (
                'retailer', 'wholesaler', 'retailer_user'
            )
        }),
        ('Fiyat Bilgileri', {
            'fields': (
                'subtotal', 'tax_amount', 'shipping_cost', 
                'discount_amount', 'total_amount', 'currency'
            ),
            'classes': ('collapse',)
        }),
        ('Tyrex Komisyonu', {
            'fields': (
                'tyrex_commission_rate', 'tyrex_commission_amount'
            ),
            'classes': ('collapse',)
        }),
        ('Teslimat Bilgileri', {
            'fields': (
                'delivery_address', 'delivery_contact', 'delivery_phone'
            ),
            'classes': ('collapse',)
        }),
        ('Ödeme Bilgileri', {
            'fields': (
                'payment_terms_days', 'due_date'
            ),
            'classes': ('collapse',)
        }),
        ('Notlar', {
            'fields': (
                'notes', 'internal_notes'
            ),
            'classes': ('collapse',)
        }),
        ('Tarihler', {
            'fields': (
                'order_date', 'confirmed_at', 'shipped_at', 
                'delivered_at', 'canceled_at'
            ),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = [
        'order_number', 'uuid', 'subtotal', 'total_amount', 
        'tyrex_commission_amount', 'order_date', 'confirmed_at',
        'shipped_at', 'delivered_at', 'canceled_at'
    ]
    
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    
    def get_retailer_link(self, obj):
        """Perakendeci linkini gösterir"""
        url = reverse('admin:companies_company_change', args=[obj.retailer.id])
        return format_html('<a href="{}">{}</a>', url, obj.retailer.name)
    get_retailer_link.short_description = 'Perakendeci'
    get_retailer_link.admin_order_field = 'retailer__name'
    
    def get_wholesaler_link(self, obj):
        """Toptancı linkini gösterir"""
        url = reverse('admin:companies_company_change', args=[obj.wholesaler.id])
        return format_html('<a href="{}">{}</a>', url, obj.wholesaler.name)
    get_wholesaler_link.short_description = 'Toptancı'
    get_wholesaler_link.admin_order_field = 'wholesaler__name'
    
    def get_status_badge(self, obj):
        """Durumu renkli badge olarak gösterir"""
        status_colors = {
            'draft': '#6c757d',      # Gri
            'pending': '#fd7e14',    # Turuncu
            'confirmed': '#17a2b8',  # Mavi
            'processing': '#6f42c1', # Mor
            'shipped': '#20c997',    # Teal
            'delivered': '#28a745',  # Yeşil
            'canceled': '#dc3545',   # Kırmızı
            'rejected': '#6c757d',   # Gri
        }
        
        color = status_colors.get(obj.status, '#6c757d')
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    get_status_badge.short_description = 'Durum'
    
    def get_payment_status_badge(self, obj):
        """Ödeme durumunu renkli badge olarak gösterir"""
        payment_colors = {
            'pending': '#fd7e14',        # Turuncu
            'paid': '#28a745',           # Yeşil
            'partially_paid': '#17a2b8', # Mavi
            'failed': '#dc3545',         # Kırmızı
            'refunded': '#6c757d',       # Gri
        }
        
        color = payment_colors.get(obj.payment_status, '#6c757d')
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; '
            'border-radius: 3px; font-size: 10px;">{}</span>',
            color,
            obj.get_payment_status_display()
        )
    get_payment_status_badge.short_description = 'Ödeme'
    
    def get_total_items(self, obj):
        """Toplam ürün adetini gösterir"""
        total = obj.get_total_items()
        unique = obj.get_total_unique_products()
        
        return format_html(
            '<strong>{}</strong> adet<br><small>({} farklı ürün)</small>',
            total, unique
        )
    get_total_items.short_description = 'Toplam Adet'
    
    def get_days_since_order(self, obj):
        """Sipariş tarihinden bu yana geçen gün sayısı"""
        from django.utils import timezone
        days = (timezone.now() - obj.order_date).days
        
        if days == 0:
            return format_html('<span style="color: green;">Bugün</span>')
        elif days <= 3:
            return format_html('<span style="color: orange;">{} gün</span>', days)
        elif days <= 7:
            return format_html('<span style="color: red;">{} gün</span>', days)
        else:
            return format_html('<span style="color: gray;">{} gün</span>', days)
    get_days_since_order.short_description = 'Geçen Süre'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'retailer', 'wholesaler', 'retailer_user'
        ).prefetch_related('items')
    
    # Toplu işlemler
    actions = ['mark_as_confirmed', 'mark_as_shipped', 'mark_as_canceled']
    
    def mark_as_confirmed(self, request, queryset):
        """Seçili siparişleri onaylı yap"""
        from django.utils import timezone
        
        updated = 0
        for order in queryset.filter(status__in=['draft', 'pending']):
            order.status = 'confirmed'
            order.confirmed_at = timezone.now()
            order.save(update_fields=['status', 'confirmed_at'])
            
            # Durum geçmişi kaydet
            OrderStatusHistory.objects.create(
                order=order,
                old_status=order.status,
                new_status='confirmed',
                changed_by=request.user,
                change_reason='Admin tarafından toplu onay'
            )
            updated += 1
        
        self.message_user(
            request,
            f'{updated} sipariş onaylandı.'
        )
    mark_as_confirmed.short_description = "Seçili siparişleri onayla"
    
    def mark_as_shipped(self, request, queryset):
        """Seçili siparişleri kargoya verildi yap"""
        from django.utils import timezone
        
        updated = 0
        for order in queryset.filter(status='processing'):
            order.status = 'shipped'
            order.shipped_at = timezone.now()
            order.save(update_fields=['status', 'shipped_at'])
            
            OrderStatusHistory.objects.create(
                order=order,
                old_status='processing',
                new_status='shipped',
                changed_by=request.user,
                change_reason='Admin tarafından toplu kargo güncelleme'
            )
            updated += 1
        
        self.message_user(
            request,
            f'{updated} sipariş kargoya verildi.'
        )
    mark_as_shipped.short_description = "Seçili siparişleri kargoya verildi yap"
    
    def mark_as_canceled(self, request, queryset):
        """Seçili siparişleri iptal et"""
        from django.utils import timezone
        
        updated = 0
        for order in queryset.filter(status__in=['draft', 'pending', 'confirmed']):
            order.status = 'canceled'
            order.canceled_at = timezone.now()
            order.save(update_fields=['status', 'canceled_at'])
            
            OrderStatusHistory.objects.create(
                order=order,
                old_status=order.status,
                new_status='canceled',
                changed_by=request.user,
                change_reason='Admin tarafından toplu iptal'
            )
            updated += 1
        
        self.message_user(
            request,
            f'{updated} sipariş iptal edildi.'
        )
    mark_as_canceled.short_description = "Seçili siparişleri iptal et"


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = [
        'get_order_link',
        'product_name',
        'product_sku',
        'quantity',
        'unit_price',
        'wholesaler_reference_price',
        'total_price',
        'get_discount_info',
        'is_canceled'
    ]
    list_filter = [
        'is_canceled',
        'order__status',
        'product__category',
        'warehouse__company'
    ]
    search_fields = [
        'order__order_number',
        'product_name',
        'product_sku',
        'product_brand'
    ]
    ordering = ['-order__created_at', 'product_name']
    
    readonly_fields = [
        'total_price', 'product_name', 'product_sku', 'product_brand',
        'canceled_at'
    ]
    
    def get_order_link(self, obj):
        """Sipariş linkini gösterir"""
        url = reverse('admin:orders_order_change', args=[obj.order.id])
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
    get_order_link.short_description = 'Sipariş'
    get_order_link.admin_order_field = 'order__order_number'
    
    def get_discount_info(self, obj):
        """İndirim bilgilerini gösterir"""
        calculated_discount = obj.get_discount_percentage_calculated()
        if calculated_discount > 0:
            return format_html(
                '<span style="color: green;">%{}</span>',
                calculated_discount
            )
        return '-'
    get_discount_info.short_description = 'İndirim'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'order', 'product', 'warehouse'
        )


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = [
        'get_order_link',
        'old_status',
        'new_status',
        'changed_by',
        'change_reason',
        'changed_at'
    ]
    list_filter = [
        'new_status',
        'old_status',
        'changed_at',
        'changed_by'
    ]
    search_fields = [
        'order__order_number',
        'change_reason',
        'notes'
    ]
    ordering = ['-changed_at']
    date_hierarchy = 'changed_at'
    
    readonly_fields = ['changed_at']
    
    def get_order_link(self, obj):
        """Sipariş linkini gösterir"""
        url = reverse('admin:orders_order_change', args=[obj.order.id])
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
    get_order_link.short_description = 'Sipariş'
    get_order_link.admin_order_field = 'order__order_number'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'order', 'changed_by'
        )