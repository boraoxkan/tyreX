from django.contrib import admin
from django.urls import path, include
from django.conf import settings # settings'i import et

urlpatterns = [
    path('admin/', admin.site.urls),
]

# Debug Toolbar URL'ini sadece DEBUG=True iken ekle
if settings.DEBUG:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ]