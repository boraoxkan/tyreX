from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, CustomerVisitViewSet, StoredTireViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'visits', CustomerVisitViewSet, basename='customer-visit')
router.register(r'stored-tires', StoredTireViewSet, basename='stored-tire')

urlpatterns = [
    path('api/', include(router.urls)),
]