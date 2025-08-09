# backend/products/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, AttributeViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'attributes', AttributeViewSet, basename='attribute')

urlpatterns = [
    path('', include(router.urls)),
]
