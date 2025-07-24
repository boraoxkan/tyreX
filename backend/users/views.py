from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
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
            },
            'companies': {
                'wholesalers': '/api/v1/companies/wholesalers/',
            }
        }
    })