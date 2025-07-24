from django.urls import path
from .views import (
    MarketProductListView,
    marketplace_stats,
    product_detail,
    clear_marketplace_cache
)

app_name = 'market'

urlpatterns = [
    # Pazaryeri ana endpoint'leri
    path('products/', MarketProductListView.as_view(), name='product_list'),
    path('products/<int:product_id>/', product_detail, name='product_detail'),
    path('stats/', marketplace_stats, name='marketplace_stats'),
    
    # Admin/Debug endpoint'leri
    path('clear-cache/', clear_marketplace_cache, name='clear_cache'),
]