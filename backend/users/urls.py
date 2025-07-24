# backend/users/urls.py - Güncellenmiş versiyon

from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)
from .views import (
    RetailerRegistrationView,
    UserProfileView,
    WholesalerListView,
    UserWholesalerRelationsView,
    AddWholesalerRelationView,
    UpdateWholesalerRelationView,
    RemoveWholesalerRelationView,
    user_company_info,
    user_wholesaler_summary,
    api_health_check
)

app_name = 'users'

urlpatterns = [
    # Kimlik doğrulama endpoint'leri
    path('auth/register/', RetailerRegistrationView.as_view(), name='register'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Kullanıcı profili endpoint'leri
    path('users/me/', UserProfileView.as_view(), name='user_profile'),
    path('users/company-info/', user_company_info, name='user_company_info'),
    
    # Toptancı ilişkisi yönetimi - YENİ!
    path('users/wholesaler-relations/', UserWholesalerRelationsView.as_view(), name='user_wholesaler_relations'),
    path('users/wholesaler-relations/add/', AddWholesalerRelationView.as_view(), name='add_wholesaler_relation'),
    path('users/wholesaler-relations/<int:pk>/', UpdateWholesalerRelationView.as_view(), name='update_wholesaler_relation'),
    path('users/wholesaler-relations/<int:pk>/remove/', RemoveWholesalerRelationView.as_view(), name='remove_wholesaler_relation'),
    path('users/wholesaler-summary/', user_wholesaler_summary, name='user_wholesaler_summary'),
    
    # Şirket bilgileri
    path('companies/wholesalers/', WholesalerListView.as_view(), name='wholesaler_list'),
    
    # Sağlık kontrolü
    path('health/', api_health_check, name='health_check'),
]