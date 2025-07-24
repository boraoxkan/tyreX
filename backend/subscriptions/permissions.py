from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from django.utils.translation import gettext_lazy as _


class IsSubscribed(permissions.BasePermission):
    """
    Kullanıcının şirketinin aktif veya deneme aboneliği olup olmadığını kontrol eder.
    
    Bu izin sınıfı şunları kontrol eder:
    1. Kullanıcının bir şirketi var mı?
    2. Şirketin bir aboneliği var mı?
    3. Abonelik aktif veya deneme sürümünde mi?
    4. Abonelik süresi dolmuş mu?
    """
    
    message = _('Bu özelliği kullanmak için aktif bir aboneliğiniz olması gerekiyor.')
    
    def has_permission(self, request, view):
        """
        Request seviyesinde izin kontrolü
        """
        # Kullanıcı giriş yapmış mı?
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Kullanıcının bir şirketi var mı?
        if not hasattr(request.user, 'company') or not request.user.company:
            self.message = _('Bu özelliği kullanmak için bir şirkete bağlı olmalısınız.')
            return False
        
        # Şirketin aboneliği var mı?
        try:
            subscription = request.user.company.subscription
        except:
            self.message = _('Şirketinizin henüz bir aboneliği bulunmuyor. Lütfen bir plan seçin.')
            return False
        
        # Abonelik aktif veya deneme sürümünde mi?
        if not subscription.is_active_or_trialing():
            if subscription.status == 'expired':
                self.message = _('Aboneliğinizin süresi dolmuş. Lütfen yenileyin.')
            elif subscription.status == 'canceled':
                self.message = _('Aboneliğiniz iptal edilmiş. Lütfen yeni bir plan seçin.')
            elif subscription.status == 'past_due':
                self.message = _('Abonelik ödemesinde gecikme var. Lütfen ödemenizi yapın.')
            else:
                self.message = _('Aboneliğiniz aktif değil. Lütfen durumunu kontrol edin.')
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        """
        Obje seviyesinde izin kontrolü
        Genellikle request seviyesi yeterli olacak, ama gerekirse override edilebilir
        """
        return self.has_permission(request, view)


class HasMarketplaceAccess(IsSubscribed):
    """
    Pazaryeri erişimi için özel izin sınıfı
    IsSubscribed'dan kalıtım alır ve ek pazaryeri kontrolü yapar
    """
    
    def has_permission(self, request, view):
        # Önce temel abonelik kontrolü
        if not super().has_permission(request, view):
            return False
        
        # Pazaryeri erişimi var mı kontrol et
        subscription = request.user.company.subscription
        if not subscription.can_access_marketplace():
            self.message = _(
                'Pazaryerine erişmek için planınızı yükseltmeniz gerekiyor. '
                'Mevcut planınız pazaryeri özelliğini desteklemiyor.'
            )
            return False
        
        return True


class HasDynamicPricing(IsSubscribed):
    """
    Dinamik fiyatlandırma erişimi için özel izin sınıfı
    """
    
    def has_permission(self, request, view):
        # Önce temel abonelik kontrolü
        if not super().has_permission(request, view):
            return False
        
        # Dinamik fiyatlandırma özelliği var mı kontrol et
        subscription = request.user.company.subscription
        if not subscription.can_use_dynamic_pricing():
            self.message = _(
                'Dinamik fiyatlandırma özelliğini kullanmak için planınızı yükseltmeniz gerekiyor.'
            )
            return False
        
        return True


class APIRateLimitPermission(IsSubscribed):
    """
    API istek limiti kontrolü için izin sınıfı
    """
    
    def has_permission(self, request, view):
        # Önce temel abonelik kontrolü
        if not super().has_permission(request, view):
            return False
        
        # API limiti kontrol et
        subscription = request.user.company.subscription
        remaining_calls = subscription.get_remaining_api_calls()
        
        if remaining_calls <= 0:
            self.message = _(
                'Aylık API istek limitinizi aştınız. '
                f'Limitiniz: {subscription.plan.api_rate_limit} istek/ay. '
                'Planınızı yükseltin veya gelecek ay bekleyin.'
            )
            return False
        
        # Başarılı istek sayısını artır (bu middleware'de de yapılabilir)
        subscription.api_calls_this_month += 1
        subscription.save(update_fields=['api_calls_this_month'])
        
        return True


class IsSubscribedOrReadOnly(permissions.BasePermission):
    """
    Aboneliği olanlar CRUD yapabilir, olmayanlar sadece READ yapabilir
    Public API'lar için kullanışlı
    """
    
    def has_permission(self, request, view):
        # Read işlemleri için herkes erişebilir
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write işlemleri için abonelik gerekli
        is_subscribed_permission = IsSubscribed()
        return is_subscribed_permission.has_permission(request, view)