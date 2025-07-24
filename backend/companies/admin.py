from django.contrib import admin
from django.utils.html import format_html
from .models import Company, RetailerWholesaler

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = [
        'name', 
        'company_type', 
        'is_managed_by_tyrex', 
        'is_active',
        'created_at',
        'get_warehouse_count'
    ]
    list_filter = [
        'company_type', 
        'is_managed_by_tyrex', 
        'is_active', 
        'created_at'
    ]
    search_fields = ['name', 'email']
    ordering = ['name']
    
    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('name', 'company_type', 'is_managed_by_tyrex', 'is_active')
        }),
        ('İletişim Bilgileri', {
            'fields': ('email', 'phone', 'address'),
            'classes': ('collapse',)
        }),
    )
    
    def get_warehouse_count(self, obj):
        """Şirketin sahip olduğu depo sayısını gösterir"""
        return obj.warehouses.count()
    get_warehouse_count.short_description = 'Depo Sayısı'
    
    def get_queryset(self, request):
        """Performans için related objectleri prefetch eder"""
        return super().get_queryset(request).prefetch_related('warehouses')


@admin.register(RetailerWholesaler)
class RetailerWholesalerAdmin(admin.ModelAdmin):
    list_display = [
        'retailer', 
        'wholesaler', 
        'is_active', 
        'credit_limit',
        'payment_terms_days',
        'start_date'
    ]
    list_filter = [
        'is_active', 
        'start_date',
        'payment_terms_days'
    ]
    search_fields = [
        'retailer__name', 
        'wholesaler__name'
    ]
    ordering = ['retailer__name', 'wholesaler__name']
    
    fieldsets = (
        ('İlişki Bilgileri', {
            'fields': ('retailer', 'wholesaler', 'is_active')
        }),
        ('Ticari Koşullar', {
            'fields': ('credit_limit', 'payment_terms_days'),
            'classes': ('collapse',)
        }),
        ('Notlar', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['start_date']
    
    def get_form(self, request, obj=None, **kwargs):
        """Form özelleştirmeleri"""
        form = super().get_form(request, obj, **kwargs)
        
        # Perakendeci seçimi için sadece retailer veya both olanları göster
        if 'retailer' in form.base_fields:
            form.base_fields['retailer'].queryset = Company.objects.filter(
                company_type__in=['retailer', 'both'],
                is_active=True
            )
        
        # Toptancı seçimi için sadece wholesaler veya both olanları göster
        if 'wholesaler' in form.base_fields:
            form.base_fields['wholesaler'].queryset = Company.objects.filter(
                company_type__in=['wholesaler', 'both'],
                is_active=True
            )
        
        return form