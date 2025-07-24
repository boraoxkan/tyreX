# backend/users/models.py - İyileştirilmiş versiyon (opsiyonel)

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

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


class User(AbstractUser):
    """
    Özel Kullanıcı Modeli - Company ile ilişkili
    """
    username = None
    email = models.EmailField(_("email address"), unique=True)

    # İYİLEŞTİRME: Company ile direct ilişki (opsiyonel)
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='users',
        verbose_name=_('Şirket'),
        help_text=_('Kullanıcının bağlı olduğu şirket')
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email
    
    def get_company_name(self):
        """Kullanıcının şirket adını döndürür"""
        return self.company.name if self.company else None
    
    def is_retailer_user(self):
        """Perakendeci şirketine bağlı kullanıcı mı?"""
        if self.company:
            return self.company.is_retailer()
        return False
    
    def is_wholesaler_user(self):
        """Toptancı şirketine bağlı kullanıcı mı?"""
        if self.company:
            return self.company.is_wholesaler()
        return False