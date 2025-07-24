from django.contrib import admin
from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 endpoint'leri
    path('api/v1/', include('users.urls')),
    path('api/v1/inventory/', include('inventory.urls')),  # YENİ EKLENDİ
]

# Debug Toolbar URL'ini sadece DEBUG=True iken ekle
if settings.DEBUG:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ]