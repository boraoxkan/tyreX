from django.db import models


class LoginPageBanner(models.Model):
    """Login sayfasında görüntülenecek reklam banner'ı"""
    
    title = models.CharField(max_length=255, verbose_name="Başlık")
    subtitle = models.TextField(blank=True, verbose_name="Alt başlık")
    description = models.TextField(blank=True, verbose_name="Açıklama")
    image = models.ImageField(upload_to='banners/', blank=True, null=True, verbose_name="Görsel")
    link_url = models.URLField(blank=True, verbose_name="Link URL")
    link_text = models.CharField(max_length=100, blank=True, verbose_name="Link Metni")
    
    background_color = models.CharField(
        max_length=50, 
        default='from-primary-600 to-primary-800',
        verbose_name="Arkaplan Gradyan"
    )
    
    is_active = models.BooleanField(default=True, verbose_name="Aktif")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Login Sayfası Banner'ı"
        verbose_name_plural = "Login Sayfası Banner'ları"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
