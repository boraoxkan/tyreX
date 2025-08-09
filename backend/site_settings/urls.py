from django.urls import path
from .views import LoginPageBannerListView

app_name = 'site_settings'

urlpatterns = [
    path('login-banners/', LoginPageBannerListView.as_view(), name='login-banners'),
]