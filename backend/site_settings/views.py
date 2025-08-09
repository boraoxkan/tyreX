from rest_framework import generics, permissions
from .models import LoginPageBanner
from .serializers import LoginPageBannerSerializer


class LoginPageBannerListView(generics.ListAPIView):
    """Aktif login banner'larını listeler"""
    serializer_class = LoginPageBannerSerializer
    permission_classes = [permissions.AllowAny]  # Login sayfasında herkes görebilir
    
    def get_queryset(self):
        return LoginPageBanner.objects.filter(is_active=True)
