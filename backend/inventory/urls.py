from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet, StockItemViewSet, inventory_summary

app_name = 'inventory'

# DRF Router ile ViewSet'leri otomatik URL'lere bağla
router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'stock-items', StockItemViewSet, basename='stockitem')

urlpatterns = [
    # Router URL'leri
    path('', include(router.urls)),
    
    # Ek endpoint'ler
    path('summary/', inventory_summary, name='inventory_summary'),
]