from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

# Özel User modelimizi admin paneline kaydediyoruz.
# UserAdmin'i kullanarak daha zengin bir arayüz elde ediyoruz.
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    # UserAdmin normalde 'username' alanını bekler.
    # Bizim modelimizde bu alan olmadığı için fieldsets'i override etmemiz gerekir.
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )