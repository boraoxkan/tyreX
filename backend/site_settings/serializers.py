from rest_framework import serializers
from .models import LoginPageBanner


class LoginPageBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginPageBanner
        fields = [
            'id',
            'title',
            'subtitle', 
            'description',
            'image',
            'link_url',
            'link_text',
            'background_color',
            'is_active'
        ]