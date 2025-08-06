# backend/core/urls.py - Güncellenmiş versiyon

from django.contrib import admin
from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 endpoint'leri
    path('api/v1/', include('users.urls')),
    path('api/v1/inventory/', include('inventory.urls')),
    path('api/v1/market/', include('market.urls')),
    path('api/v1/orders/', include('orders.urls')),
    path('api/v1/customers/', include('customers.urls')),
]

# Debug Toolbar URL'ini sadece DEBUG=True ve ENABLE_DEBUG_TOOLBAR=True iken ekle
if settings.DEBUG and getattr(settings, 'ENABLE_DEBUG_TOOLBAR', False):
    try:
        import debug_toolbar
        urlpatterns += [
            path('__debug__/', include(debug_toolbar.urls)),
        ]
    except ImportError:
        # Debug toolbar kurulu değilse sessizce geç
        pass