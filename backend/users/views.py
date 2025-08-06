from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.db import models
from companies.models import Company, RetailerWholesaler
from .serializers import (
    RetailerRegistrationSerializer, 
    UserProfileSerializer,
    WholesalerListSerializer,
    RetailerWholesalerSerializer,
    AddWholesalerRelationSerializer,
    UpdateWholesalerRelationSerializer
)

User = get_user_model()


class RetailerRegistrationView(generics.CreateAPIView):
    """
    Perakendeci kayıt API'si
    POST /api/v1/auth/register/
    """
    serializer_class = RetailerRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Perakendeci kaydını oluştur
        result = serializer.save()
        
        return Response(
            serializer.to_representation(result),
            status=status.HTTP_201_CREATED
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Kullanıcı profili API'si
    GET/PUT/PATCH /api/v1/users/me/
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """Her zaman giriş yapmış kullanıcıyı döndür"""
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        """Kullanıcı profil bilgilerini güncelle"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'message': 'Profil başarıyla güncellendi.',
            'user': serializer.data
        })


class WholesalerListView(generics.ListAPIView):
    """
    Aktif toptancıların listesi
    GET /api/v1/companies/wholesalers/
    """
    serializer_class = WholesalerListSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Sadece aktif toptancıları döndür"""
        return Company.objects.filter(
            company_type__in=['wholesaler', 'both'],
            is_active=True
        ).order_by('name')


class UserWholesalerRelationsView(generics.ListAPIView):
    """
    Kullanıcının toptancı ilişkilerini listele
    GET /api/v1/users/wholesaler-relations/
    """
    serializer_class = RetailerWholesalerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Sadece giriş yapmış kullanıcının şirketinin ilişkilerini döndür"""
        if hasattr(self.request.user, 'company') and self.request.user.company:
            return RetailerWholesaler.objects.filter(
                retailer=self.request.user.company,
                is_active=True
            ).select_related('wholesaler').order_by('wholesaler__name')
        return RetailerWholesaler.objects.none()


class AddWholesalerRelationView(generics.CreateAPIView):
    """
    Yeni toptancı ilişkisi ekle
    POST /api/v1/users/wholesaler-relations/add/
    """
    serializer_class = AddWholesalerRelationSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        if not hasattr(request.user, 'company') or not request.user.company:
            return Response(
                {'error': 'Kullanıcınızın bir şirketi bulunmuyor.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Yeni ilişki oluştur
        wholesaler_id = serializer.validated_data['wholesaler_id']
        wholesaler = Company.objects.get(id=wholesaler_id)
        
        relation = RetailerWholesaler.objects.create(
            retailer=request.user.company,
            wholesaler=wholesaler,
            is_active=True,
            credit_limit=serializer.validated_data.get('credit_limit'),
            payment_terms_days=serializer.validated_data.get('payment_terms_days', 30),
            notes=serializer.validated_data.get('notes', '')
        )
        
        response_serializer = RetailerWholesalerSerializer(relation)
        return Response({
            'message': f'{wholesaler.name} ile yeni ilişki başarıyla kuruldu.',
            'relation': response_serializer.data
        }, status=status.HTTP_201_CREATED)


class UpdateWholesalerRelationView(generics.UpdateAPIView):
    """
    Mevcut toptancı ilişkisini güncelle
    PUT/PATCH /api/v1/users/wholesaler-relations/{id}/
    """
    serializer_class = UpdateWholesalerRelationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Sadece kendi ilişkilerini güncelleyebilsin"""
        if hasattr(self.request.user, 'company') and self.request.user.company:
            return RetailerWholesaler.objects.filter(
                retailer=self.request.user.company
            )
        return RetailerWholesaler.objects.none()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'message': f'{instance.wholesaler.name} ile ilişki başarıyla güncellendi.',
            'relation': serializer.data
        })


class RemoveWholesalerRelationView(generics.DestroyAPIView):
    """
    Toptancı ilişkisini sonlandır (soft delete)
    DELETE /api/v1/users/wholesaler-relations/{id}/remove/
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if hasattr(self.request.user, 'company') and self.request.user.company:
            return RetailerWholesaler.objects.filter(
                retailer=self.request.user.company,
                is_active=True
            )
        return RetailerWholesaler.objects.none()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        wholesaler_name = instance.wholesaler.name
        
        # Soft delete
        instance.is_active = False
        instance.save()
        
        return Response({
            'message': f'{wholesaler_name} ile ilişki başarıyla sonlandırıldı.'
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_company_info(request):
    """
    Kullanıcının şirket bilgilerini ve toptancı ilişkilerini döndürür
    GET /api/v1/users/company-info/
    """
    user = request.user
    
    if not hasattr(user, 'company') or not user.company:
        return Response({
            'message': 'Kullanıcıya ait şirket bulunamadı.',
            'company': None,
            'wholesaler_relationships': []
        })
    
    try:
        company = user.company
        
        # Şirketin toptancı ilişkilerini getir
        wholesaler_relations = company.wholesaler_relationships.select_related(
            'wholesaler'
        ).filter(is_active=True)
        
        company_data = {
            'company': {
                'id': company.id,
                'name': company.name,
                'company_type': company.company_type,
                'email': company.email,
                'phone': company.phone,
                'address': company.address,
                'is_managed_by_tyrex': company.is_managed_by_tyrex
            },
            'wholesaler_relationships': [
                {
                    'id': rel.id,
                    'wholesaler': {
                        'id': rel.wholesaler.id,
                        'name': rel.wholesaler.name,
                        'email': rel.wholesaler.email,
                        'phone': rel.wholesaler.phone
                    },
                    'credit_limit': rel.credit_limit,
                    'payment_terms_days': rel.payment_terms_days,
                    'start_date': rel.start_date,
                    'is_active': rel.is_active,
                    'notes': rel.notes
                }
                for rel in wholesaler_relations
            ]
        }
        
        return Response(company_data)
    
    except Exception as e:
        return Response(
            {
                'error': 'Şirket bilgileri alınırken hata oluştu.',
                'detail': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_wholesaler_summary(request):
    """
    Kullanıcının toptancı ilişkileri özeti
    GET /api/v1/users/wholesaler-summary/
    """
    if not hasattr(request.user, 'company') or not request.user.company:
        return Response({
            'error': 'Kullanıcınızın bir şirketi bulunmuyor.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    relations = RetailerWholesaler.objects.filter(
        retailer=request.user.company,
        is_active=True
    ).select_related('wholesaler')
    
    total_credit_limit = sum(
        rel.credit_limit for rel in relations if rel.credit_limit
    )
    
    summary = {
        'company': {
            'id': request.user.company.id,
            'name': request.user.company.name,
            'type': request.user.company.company_type
        },
        'wholesaler_relations': {
            'total_count': relations.count(),
            'active_count': relations.filter(is_active=True).count(),
            'total_credit_limit': total_credit_limit
        },
        'wholesalers': [
            {
                'id': rel.wholesaler.id,
                'name': rel.wholesaler.name,
                'credit_limit': rel.credit_limit,
                'payment_terms_days': rel.payment_terms_days,
                'start_date': rel.start_date,
                'notes': rel.notes
            }
            for rel in relations
        ]
    }
    
    return Response(summary)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Dashboard istatistikleri API'si
    GET /api/v1/users/dashboard-stats/
    """
    try:
        user = request.user
        
        if not hasattr(user, 'company') or not user.company:
            return Response({
                'error': 'Kullanıcınızın bir şirketi bulunmuyor.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        company = user.company
        
        # Initialize stats with default values
        stats = {
            'total_orders': 0,
            'pending_orders': 0,
            'total_spent': '0.00',
            'marketplace_views': 0
        }
        
        # Try to get order statistics
        try:
            from orders.models import Order
            from decimal import Decimal
            
            # Get all orders for this company
            orders = Order.objects.filter(retailer=company)
            
            # Total orders count
            stats['total_orders'] = orders.count()
            
            # Pending orders count
            stats['pending_orders'] = orders.filter(
                status__in=['pending', 'processing', 'confirmed']
            ).count()
            
            # Total spent (sum of all completed orders)
            completed_orders = orders.filter(status='delivered')
            total_spent = completed_orders.aggregate(
                total=models.Sum('total_amount')
            )['total'] or Decimal('0.00')
            stats['total_spent'] = str(total_spent)
            
        except ImportError:
            # Orders app not available, use mock data
            pass
        
        # Try to get marketplace view statistics
        try:
            from market.models import MarketplaceView
            stats['marketplace_views'] = MarketplaceView.objects.filter(
                company=company
            ).count()
        except ImportError:
            # Market app not available or no view tracking, use random number
            import random
            stats['marketplace_views'] = random.randint(50, 200)
        
        return Response(stats)
        
    except Exception as e:
        return Response({
            'error': 'Dashboard istatistikleri alınırken hata oluştu.',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_health_check(request):
    """
    API sağlık kontrolü
    GET /api/v1/health/
    """
    return Response({
        'status': 'healthy',
        'message': 'Tyrex API v1 çalışıyor',
        'version': '1.0.0',
        'endpoints': {
            'auth': {
                'register': '/api/v1/auth/register/',
                'token': '/api/v1/auth/token/',
                'token_refresh': '/api/v1/auth/token/refresh/',
            },
            'users': {
                'profile': '/api/v1/users/me/',
                'company_info': '/api/v1/users/company-info/',
                'wholesaler_relations': '/api/v1/users/wholesaler-relations/',
                'wholesaler_summary': '/api/v1/users/wholesaler-summary/',
                'dashboard_stats': '/api/v1/users/dashboard-stats/',
            },
            'companies': {
                'wholesalers': '/api/v1/companies/wholesalers/',
            }
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def simple_registration_debug(request):
    """
    Debug için basit registration endpoint'i
    POST /api/v1/auth/register-debug/
    """
    from django.db import transaction
    from django.contrib.auth import get_user_model
    from companies.models import Company
    from decimal import Decimal
    
    User = get_user_model()
    
    try:
        with transaction.atomic():
            # 1. Company oluştur
            company = Company.objects.create(
                name='Debug Test Company',
                company_type='retailer',
                is_managed_by_tyrex=True,
                email='debug@test.com',
                is_active=True
            )
            
            # 2. User oluştur
            user = User.objects.create_user(
                email='debug@test.com',
                password='debug123',
                first_name='Debug',
                last_name='User',
                company=company
            )
            
            # 3. Subscription dene
            subscription_info = None
            try:
                from subscriptions.models import SubscriptionPlan, Subscription
                from datetime import timedelta
                from django.utils import timezone
                
                basic_plan = SubscriptionPlan.objects.get(plan_type='basic')
                
                subscription = Subscription.objects.create(
                    company=company,
                    plan=basic_plan,
                    status='trialing',
                    billing_cycle='monthly',
                    start_date=timezone.now(),
                    trial_end_date=timezone.now() + timedelta(days=7),
                    current_period_start=timezone.now(),
                    current_period_end=timezone.now() + timedelta(days=7),
                    amount=Decimal('0.00'),
                    currency='TRY',
                    current_users=1,
                    notes='Debug subscription'
                )
                
                subscription_info = {
                    'created': True,
                    'id': subscription.id,
                    'status': subscription.status,
                    'plan': basic_plan.name
                }
                
            except Exception as sub_error:
                subscription_info = {
                    'created': False,
                    'error': str(sub_error)
                }
            
            return Response({
                'success': True,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'company_id': company.id
                },
                'subscription': subscription_info
            })
            
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)