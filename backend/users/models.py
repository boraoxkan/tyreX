from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

# YENİ EKLENDİ: CustomUserManager Sınıfı
class CustomUserManager(BaseUserManager):
    """
    E-posta adresi ile kullanıcı oluşturan özel kullanıcı yöneticisi.
    """
    def create_user(self, email, password, **extra_fields):
        """
        Verilen e-posta ve şifre ile bir kullanıcı oluşturur ve kaydeder.
        """
        if not email:
            raise ValueError(_("The Email must be set"))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Verilen e-posta ve şifre ile bir süper kullanıcı oluşturur ve kaydeder.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
            
        return self.create_user(email, password, **extra_fields)


# MEVCUT User Modelini Güncelliyoruz
class User(AbstractUser):
    """
    Özel Kullanıcı Modeli.
    """
    username = None
    email = models.EmailField(_("email address"), unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    # YENİ EKLENDİ: Django'ya özel yöneticimizi kullanmasını söylüyoruz.
    objects = CustomUserManager()

    def __str__(self):
        return self.email