from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from .models import SubscriptionPlan, Subscription
from .serializers import SubscriptionPlanSerializer, SubscriptionSerializer
from .permissions import IsSubscribed


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Abonelik planları - Sadece okuma izinli
    Herkes görebilir ama sadece admin değiştirebilir
    """
    queryset = SubscriptionPlan.objects.filter(is_active=True).order_by('sort_order', 'monthly_price')
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def available_plans(self, request):
        """Kullanılabilir planları listele"""
        plans = self.get_queryset()
        serializer = self.get_serializer(plans, many=True)
        
        # Mevcut kullanıcının aboneliğini kontrol et
        current_plan = None
        if hasattr(request.user, 'company') and hasattr(request.user.company, 'subscription'):
            current_plan = request.user.company.subscription.plan.plan_type
        
        data = serializer.data
        for plan_data in data:
            plan_data['is_current'] = plan_data['plan_type'] == current_plan
        
        return Response(data)


class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    Şirket abonelikleri - CRUD işlemleri
    """
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Sadece kullanıcının şirketinin aboneliklerini döndür"""
        if hasattr(self.request.user, 'company'):
            return Subscription.objects.filter(company=self.request.user.company)
        return Subscription.objects.none()
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Mevcut abonelik bilgilerini döndür"""
        try:
            if not hasattr(request.user, 'company') or not request.user.company:
                return Response(
                    {'error': _('Kullanıcının şirketi bulunmuyor.')}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            subscription = request.user.company.subscription
            serializer = self.get_serializer(subscription)
            
            # Ek bilgiler ekle
            data = serializer.data
            data['permissions'] = {
                'marketplace_access': subscription.can_access_marketplace(),
                'customer_management_access': subscription.can_access_customer_management(),
                'full_dashboard_access': subscription.can_access_full_dashboard(),
                'dynamic_pricing': subscription.can_use_dynamic_pricing(),
            }
            data['usage'] = {
                'remaining_api_calls': subscription.get_remaining_api_calls(),
                'is_over_limits': subscription.is_over_limits(),
                'days_until_expiry': subscription.days_until_expiry(),
            }
            
            return Response(data)
            
        except Subscription.DoesNotExist:
            return Response(
                {'error': _('Abonelik bulunamadı.')}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def upgrade(self, request):
        """Plan yükseltme"""
        plan_id = request.data.get('plan_id')
        billing_cycle = request.data.get('billing_cycle', 'monthly')
        
        if not plan_id:
            return Response(
                {'error': _('Plan ID gereklidir.')}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': _('Geçersiz plan ID.')}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not hasattr(request.user, 'company') or not request.user.company:
            return Response(
                {'error': _('Kullanıcının şirketi bulunmuyor.')}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Mevcut aboneliği güncelle veya yeni oluştur
        subscription, created = Subscription.objects.get_or_create(
            company=request.user.company,
            defaults={
                'plan': new_plan,
                'billing_cycle': billing_cycle,
                'status': 'trialing',  # Yeni abonelik deneme ile başlar
            }
        )
        
        if not created:
            # Mevcut aboneliği güncelle
            subscription.plan = new_plan
            subscription.billing_cycle = billing_cycle
            if subscription.status in ['expired', 'canceled']:
                subscription.status = 'trialing'
            subscription.save()
        
        serializer = self.get_serializer(subscription)
        
        return Response({
            'message': _('Plan başarıyla güncellendi.'),
            'subscription': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def cancel(self, request):
        """Abonelik iptal et"""
        try:
            if not hasattr(request.user, 'company') or not request.user.company:
                return Response(
                    {'error': _('Kullanıcının şirketi bulunmuyor.')}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            subscription = request.user.company.subscription
            subscription.status = 'canceled'
            subscription.canceled_at = timezone.now()
            subscription.save()
            
            return Response({
                'message': _('Abonelik başarıyla iptal edildi.')
            })
            
        except Subscription.DoesNotExist:
            return Response(
                {'error': _('Abonelik bulunamadı.')}, 
                status=status.HTTP_404_NOT_FOUND
            )
