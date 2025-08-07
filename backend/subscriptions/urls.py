from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriptionPlanViewSet, SubscriptionViewSet

app_name = 'subscriptions'

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='plans')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscriptions')

urlpatterns = [
    path('', include(router.urls)),
]