# backend/orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, calculate_cart, order_statistics

app_name = 'orders'

# DRF Router ile ViewSet'leri otomatik URL'lere bağla
router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    # Router URL'leri
    path('', include(router.urls)),
    
    # Ek endpoint'ler
    path('orders/calculate-cart/', calculate_cart, name='calculate_cart'),
    path('orders/statistics/', order_statistics, name='order_statistics'),
]