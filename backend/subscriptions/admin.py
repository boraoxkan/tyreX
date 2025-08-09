from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import SubscriptionPlan, Subscription, SubscriptionUsage


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'plan_type',
        'monthly_price',
        'yearly_price',
        'get_yearly_discount',
        'marketplace_access',
        'dynamic_pricing',
        'is_active',
        'get_subscriber_count'
    ]
    list_filter = [
        'plan_type',
        'marketplace_access',
        'dynamic_pricing',
        'priority_support',
        'is_active'
    ]
    search_fields = ['name', 'description']
    ordering = ['sort_order', 'monthly_price']
    
    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('name', 'plan_type', 'description', 'is_active', 'sort_order')
        }),
        ('Fiyatlandırma', {
            'fields': ('monthly_price', 'yearly_price', 'tyrex_commission_rate'),
            'classes': ('collapse',)
        }),
        ('Limitler', {
            'fields': ('max_users', 'max_warehouses', 'max_products', 'api_rate_limit'),
            'classes': ('collapse',)
        }),
        ('Özellikler', {
            'fields': (
                'marketplace_access',
                'dynamic_pricing', 
                'advanced_analytics',
                'priority_support',
                'features'
            ),
            'classes': ('collapse',)
        }),
    )
    
    def get_yearly_discount(self, obj):
        """Yıllık indirim yüzdesini gösterir"""
        discount = obj.get_yearly_discount_percentage()
        if discount > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">%{}%</span>',
                discount
            )
        return '-'
    get_yearly_discount.short_description = 'Yıllık İndirim'
    
    def get_subscriber_count(self, obj):
        """Bu planı kullanan aktif aboneleri gösterir"""
        active_subs = obj.subscriptions.filter(
            status__in=['active', 'trialing']
        ).count()
        
        if active_subs > 0:
            return format_html(
                '<span style="color: blue; font-weight: bold;">{} aktif</span>',
                active_subs
            )
        return '0'
    get_subscriber_count.short_description = 'Aktif Abone'
    
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('subscriptions')


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'company',
        'plan',
        'get_status_badge',
        'billing_cycle',
        'amount',
        'get_days_remaining',
        'get_usage_info',
        'is_over_limits_display'
    ]
    list_filter = [
        'status',
        'billing_cycle',
        'plan__plan_type',
        'plan__marketplace_access',
        'created_at'
    ]
    search_fields = [
        'company__name',
        'plan__name'
    ]
    ordering = ['-created_at']
    readonly_fields = [
        'created_at',
        'updated_at',
        'get_days_remaining',
        'get_usage_info'
    ]
    
    fieldsets = (
        ('Abonelik Bilgileri', {
            'fields': ('company', 'plan', 'status', 'billing_cycle', 'amount', 'currency')
        }),
        ('Tarihler', {
            'fields': (
                'start_date',
                'trial_end_date',
                'current_period_start',
                'current_period_end',
                'canceled_at'
            ),
            'classes': ('collapse',)
        }),
        ('Kullanım İstatistikleri', {
            'fields': (
                'current_users',
                'current_warehouses', 
                'current_products',
                'api_calls_this_month'
            ),
            'classes': ('collapse',)
        }),
        ('Notlar', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Meta Bilgiler', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_status_badge(self, obj):
        """Durumu renkli badge olarak gösterir"""
        status_colors = {
            'trialing': '#17a2b8',    # Mavi
            'active': '#28a745',      # Yeşil
            'past_due': '#fd7e14',    # Turuncu
            'canceled': '#6c757d',    # Gri
            'unpaid': '#dc3545',      # Kırmızı
            'expired': '#6f42c1',     # Mor
        }
        
        color = status_colors.get(obj.status, '#6c757d')
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    get_status_badge.short_description = 'Durum'
    
    def get_days_remaining(self, obj):
        """Kalan gün sayısını gösterir"""
        days = obj.days_until_expiry()
        if days is not None:
            if days <= 3:
                color = 'red'
            elif days <= 7:
                color = 'orange'
            else:
                color = 'green'
            
            return format_html(
                '<span style="color: {}; font-weight: bold;">{} gün</span>',
                color,
                days
            )
        return '-'
    get_days_remaining.short_description = 'Kalan Süre'
    
    def get_usage_info(self, obj):
        """Kullanım bilgilerini gösterir"""
        return format_html(
            'K: {}/{} | D: {}/{} | Ü: {}/{} | API: {}/{}',
            obj.current_users, obj.plan.max_users,
            obj.current_warehouses, obj.plan.max_warehouses,
            obj.current_products, obj.plan.max_products,
            obj.api_calls_this_month, obj.plan.api_rate_limit
        )
    get_usage_info.short_description = 'Kullanım (K:Kullanıcı, D:Depo, Ü:Ürün, API:Çağrı)'
    
    def is_over_limits_display(self, obj):
        """Limit aşımlarını gösterir"""
        limits = obj.is_over_limits()
        over_limits = [k for k, v in limits.items() if v]
        
        if over_limits:
            return format_html(
                '<span style="color: red; font-weight: bold;">⚠️ {}</span>',
                ', '.join(over_limits)
            )
        return format_html('<span style="color: green;">✅ OK</span>')
    is_over_limits_display.short_description = 'Limit Durumu'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'company', 'plan'
        ).prefetch_related('usage_records')
    
    # Toplu işlemler
    actions = ['activate_subscriptions', 'cancel_subscriptions']
    
    def activate_subscriptions(self, request, queryset):
        """Seçili abonelikleri aktif yap"""
        updated = queryset.update(status='active')
        self.message_user(
            request,
            f'{updated} abonelik aktif duruma getirildi.'
        )
    activate_subscriptions.short_description = "Seçili abonelikleri aktif yap"
    
    def cancel_subscriptions(self, request, queryset):
        """Seçili abonelikleri iptal et"""
        updated = queryset.update(
            status='canceled',
            canceled_at=timezone.now()
        )
        self.message_user(
            request,
            f'{updated} abonelik iptal edildi.'
        )
    cancel_subscriptions.short_description = "Seçili abonelikleri iptal et"


@admin.register(SubscriptionUsage)
class SubscriptionUsageAdmin(admin.ModelAdmin):
    list_display = [
        'subscription',
        'get_period_display',
        'api_calls',
        'marketplace_views',
        'orders_created',
        'revenue_generated'
    ]
    list_filter = [
        'period_start',
        'subscription__plan__plan_type'
    ]
    search_fields = [
        'subscription__company__name'
    ]
    ordering = ['-period_start']
    readonly_fields = ['created_at']
    
    def get_period_display(self, obj):
        """Dönemi güzel formatta gösterir"""
        return f"{obj.period_start.strftime('%Y-%m-%d')} - {obj.period_end.strftime('%Y-%m-%d')}"
    get_period_display.short_description = 'Dönem'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'subscription__company',
            'subscription__plan'
        )