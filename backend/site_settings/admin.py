from django.contrib import admin
from .models import LoginPageBanner


@admin.register(LoginPageBanner)
class LoginPageBannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'subtitle']
    
    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('title', 'subtitle', 'description')
        }),
        ('Görsel ve Link', {
            'fields': ('image', 'link_url', 'link_text')
        }),
        ('Tasarım', {
            'fields': ('background_color',)
        }),
        ('Durum', {
            'fields': ('is_active',)
        }),
    )
