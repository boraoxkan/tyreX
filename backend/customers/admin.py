from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Customer, CustomerVisit, StoredTire


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'customer_type', 'wholesaler', 'phone', 
        'tire_hotel_enabled', 'is_active', 'registration_date'
    ]
    list_filter = [
        'customer_type', 'wholesaler', 'tire_hotel_enabled', 
        'is_active', 'is_vip', 'registration_date'
    ]
    search_fields = ['name', 'company_name', 'email', 'phone', 'customer_code']
    ordering = ['name']
    
    fieldsets = (
        (_('Temel Bilgiler'), {
            'fields': ('name', 'customer_type', 'wholesaler', 'customer_code')
        }),
        (_('İletişim Bilgileri'), {
            'fields': ('email', 'phone', 'address')
        }),
        (_('Kurumsal Bilgiler'), {
            'fields': ('company_name', 'tax_number'),
            'classes': ('collapse',)
        }),
        (_('Ticari Bilgiler'), {
            'fields': ('credit_limit', 'payment_terms_days', 'discount_rate'),
            'classes': ('collapse',)
        }),
        (_('Lastik Oteli'), {
            'fields': ('tire_hotel_enabled', 'tire_storage_capacity')
        }),
        (_('Durum'), {
            'fields': ('is_active', 'is_vip', 'notes')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('wholesaler')


@admin.register(CustomerVisit)
class CustomerVisitAdmin(admin.ModelAdmin):
    list_display = [
        'customer', 'visit_type', 'visit_date', 'sale_amount', 
        'served_by', 'is_completed', 'customer_satisfaction'
    ]
    list_filter = [
        'visit_type', 'visit_date', 'is_completed', 
        'customer_satisfaction', 'customer__wholesaler'
    ]
    search_fields = ['customer__name', 'description']
    ordering = ['-visit_date']
    
    fieldsets = (
        (_('Ziyaret Bilgileri'), {
            'fields': ('customer', 'visit_type', 'description')
        }),
        (_('İşlem Detayları'), {
            'fields': ('sale_amount', 'served_by', 'duration_minutes')
        }),
        (_('Değerlendirme'), {
            'fields': ('is_completed', 'customer_satisfaction', 'notes')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'customer', 'customer__wholesaler', 'served_by'
        )


@admin.register(StoredTire)
class StoredTireAdmin(admin.ModelAdmin):
    list_display = [
        'customer', 'tire_brand', 'tire_model', 'tire_size', 
        'tire_season', 'quantity', 'storage_date', 'is_active'
    ]
    list_filter = [
        'tire_season', 'tire_condition', 'has_rims', 'is_active', 
        'storage_date', 'customer__wholesaler'
    ]
    search_fields = [
        'customer__name', 'tire_brand', 'tire_model', 
        'tire_size', 'storage_location'
    ]
    ordering = ['-storage_date']
    
    fieldsets = (
        (_('Müşteri'), {
            'fields': ('customer',)
        }),
        (_('Lastik Bilgileri'), {
            'fields': (
                'tire_brand', 'tire_model', 'tire_size', 
                'tire_season', 'quantity', 'tire_condition', 'production_year'
            )
        }),
        (_('Jant Bilgileri'), {
            'fields': ('has_rims', 'rim_brand', 'rim_size'),
            'classes': ('collapse',)
        }),
        (_('Depolama'), {
            'fields': (
                'storage_location', 'planned_pickup_date', 
                'actual_pickup_date', 'storage_fee_monthly'
            )
        }),
        (_('Durum ve Notlar'), {
            'fields': ('is_active', 'notes', 'special_instructions', 'has_photos')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer', 'customer__wholesaler')
    
    readonly_fields = ['storage_date']