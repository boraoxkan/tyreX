from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import Coalesce

from subscriptions.permissions import HasCustomerManagementAccess
from .models import Customer, CustomerVisit, StoredTire
from .serializers import (
    CustomerSerializer, CustomerListSerializer, CustomerVisitSerializer, 
    StoredTireSerializer, CustomerStatsSerializer, CustomerDashboardSerializer
)


class CustomerViewSet(viewsets.ModelViewSet):
    """
    Müşteri yönetimi viewset'i
    """
    serializer_class = CustomerSerializer
    permission_classes = [HasCustomerManagementAccess]
    
    def get_queryset(self):
        """Sadece kullanıcının şirketinin müşterilerini getir"""
        user = self.request.user
        if not user.company:
            return Customer.objects.none()
        
        # Kullanıcının şirketi toptancı olmalı
        if not user.company.is_wholesaler():
            return Customer.objects.none()
        
        queryset = Customer.objects.filter(
            wholesaler=user.company
        ).select_related('wholesaler')
        
        # Filtreleme
        active_only = self.request.query_params.get('active_only', None)
        if active_only and active_only.lower() == 'true':
            queryset = queryset.filter(is_active=True)
            
        tire_hotel_only = self.request.query_params.get('tire_hotel_only', None)
        if tire_hotel_only and tire_hotel_only.lower() == 'true':
            queryset = queryset.filter(tire_hotel_enabled=True)
            
        vip_only = self.request.query_params.get('vip_only', None)
        if vip_only and vip_only.lower() == 'true':
            queryset = queryset.filter(is_vip=True)
            
        customer_type = self.request.query_params.get('customer_type', None)
        if customer_type:
            queryset = queryset.filter(customer_type=customer_type)
        
        # Arama
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(company_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(customer_code__icontains=search)
            )
        
        return queryset
    
    def get_serializer_class(self):
        """Liste için basit serializeri kullan"""
        if self.action == 'list':
            return CustomerListSerializer
        return CustomerSerializer
    
    def perform_create(self, serializer):
        """Yeni müşteri oluştururken toptancıyı otomatik ata"""
        serializer.save(wholesaler=self.request.user.company)
    
    @action(detail=True, methods=['get'])
    def visits(self, request, pk=None):
        """Müşterinin ziyaret geçmişi"""
        customer = self.get_object()
        visits = CustomerVisit.objects.filter(customer=customer).order_by('-visit_date')
        
        # Tarih filtresi
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            visits = visits.filter(visit_date__date__gte=start_date)
        if end_date:
            visits = visits.filter(visit_date__date__lte=end_date)
        
        page = self.paginate_queryset(visits)
        if page is not None:
            serializer = CustomerVisitSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = CustomerVisitSerializer(visits, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stored_tires(self, request, pk=None):
        """Müşterinin depolanmış lastikleri"""
        customer = self.get_object()
        stored_tires = StoredTire.objects.filter(customer=customer).order_by('-storage_date')
        
        # Sadece aktif lastikler
        active_only = request.query_params.get('active_only', 'false')
        if active_only.lower() == 'true':
            stored_tires = stored_tires.filter(is_active=True)
        
        page = self.paginate_queryset(stored_tires)
        if page is not None:
            serializer = StoredTireSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = StoredTireSerializer(stored_tires, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_vip(self, request, pk=None):
        """Müşteriyi VIP yapma/çıkarma"""
        customer = self.get_object()
        customer.is_vip = not customer.is_vip
        customer.save()
        
        return Response({
            'message': f'Müşteri {"VIP" if customer.is_vip else "normal"} müşteri olarak işaretlendi.',
            'is_vip': customer.is_vip
        })
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Müşteriler dashboard verisi"""
        user = request.user
        if not user.company or not user.company.is_wholesaler():
            return Response(
                {'error': 'Bu işlem sadece toptancılar için geçerlidir.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Temel istatistikler
        customers = Customer.objects.filter(wholesaler=user.company)
        
        # Bugün ve bu ay
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        stats = {
            'total_customers': customers.count(),
            'active_customers': customers.filter(is_active=True).count(),
            'vip_customers': customers.filter(is_vip=True).count(),
            'tire_hotel_customers': customers.filter(tire_hotel_enabled=True).count(),
            
            # Ziyaret istatistikleri
            'total_visits_today': CustomerVisit.objects.filter(
                customer__wholesaler=user.company,
                visit_date__date=today
            ).count(),
            'total_visits_this_month': CustomerVisit.objects.filter(
                customer__wholesaler=user.company,
                visit_date__date__gte=month_start
            ).count(),
            'avg_customer_satisfaction': CustomerVisit.objects.filter(
                customer__wholesaler=user.company,
                customer_satisfaction__isnull=False
            ).aggregate(
                avg_satisfaction=Coalesce(Avg('customer_satisfaction'), 0.0, output_field=models.FloatField())
            )['avg_satisfaction'],
            
            # Lastik oteli istatistikleri
            'total_stored_tires': StoredTire.objects.filter(
                customer__wholesaler=user.company,
                is_active=True
            ).count(),
            'total_storage_revenue': StoredTire.objects.filter(
                customer__wholesaler=user.company
            ).aggregate(
                total_revenue=Coalesce(Sum('storage_fee_monthly'), 0.0, output_field=models.DecimalField(max_digits=12, decimal_places=2))
            )['total_revenue'],
            'overdue_pickups': StoredTire.objects.filter(
                customer__wholesaler=user.company,
                is_active=True,
                planned_pickup_date__lt=today
            ).count(),
        }
        
        # Son ziyaretler
        recent_visits = CustomerVisit.objects.filter(
            customer__wholesaler=user.company
        ).select_related('customer', 'served_by').order_by('-visit_date')[:5]
        
        # Son depolanmış lastikler
        recent_tire_storage = StoredTire.objects.filter(
            customer__wholesaler=user.company
        ).select_related('customer').order_by('-storage_date')[:5]
        
        # En çok ziyaret eden müşteriler
        from django.db.models import Value
        from django.utils import timezone as tz
        
        top_customers = customers.annotate(
            total_visits=Count('visits'),
            last_visit_date=Value(tz.now(), output_field=models.DateTimeField())
        ).order_by('-total_visits')[:5]
        
        dashboard_data = {
            'stats': stats,
            'recent_visits': CustomerVisitSerializer(recent_visits, many=True).data,
            'recent_tire_storage': StoredTireSerializer(recent_tire_storage, many=True).data,
            'top_customers': CustomerListSerializer(top_customers, many=True).data,
        }
        
        return Response(dashboard_data)


class CustomerVisitViewSet(viewsets.ModelViewSet):
    """
    Müşteri ziyaret yönetimi viewset'i
    """
    serializer_class = CustomerVisitSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Sadece kullanıcının şirketinin müşteri ziyaretlerini getir"""
        user = self.request.user
        if not user.company or not user.company.is_wholesaler():
            return CustomerVisit.objects.none()
        
        queryset = CustomerVisit.objects.filter(
            customer__wholesaler=user.company
        ).select_related('customer', 'served_by')
        
        # Filtreleme
        customer_id = self.request.query_params.get('customer', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
            
        visit_type = self.request.query_params.get('visit_type', None)
        if visit_type:
            queryset = queryset.filter(visit_type=visit_type)
            
        start_date = self.request.query_params.get('start_date', None)
        if start_date:
            queryset = queryset.filter(visit_date__date__gte=start_date)
            
        end_date = self.request.query_params.get('end_date', None)
        if end_date:
            queryset = queryset.filter(visit_date__date__lte=end_date)
        
        return queryset.order_by('-visit_date')
    
    def perform_create(self, serializer):
        """Yeni ziyaret oluştururken kullanıcıyı otomatik ata"""
        serializer.save(served_by=self.request.user)


class StoredTireViewSet(viewsets.ModelViewSet):
    """
    Depolanmış lastik yönetimi viewset'i
    """
    serializer_class = StoredTireSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Sadece kullanıcının şirketinin depolanmış lastiklerini getir"""
        user = self.request.user
        if not user.company or not user.company.is_wholesaler():
            return StoredTire.objects.none()
        
        queryset = StoredTire.objects.filter(
            customer__wholesaler=user.company
        ).select_related('customer')
        
        # Filtreleme
        customer_id = self.request.query_params.get('customer', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
            
        active_only = self.request.query_params.get('active_only', None)
        if active_only and active_only.lower() == 'true':
            queryset = queryset.filter(is_active=True)
            
        tire_season = self.request.query_params.get('tire_season', None)
        if tire_season:
            queryset = queryset.filter(tire_season=tire_season)
            
        overdue_only = self.request.query_params.get('overdue_only', None)
        if overdue_only and overdue_only.lower() == 'true':
            today = timezone.now().date()
            queryset = queryset.filter(
                is_active=True,
                planned_pickup_date__lt=today
            )
        
        return queryset.order_by('-storage_date')
    
    @action(detail=True, methods=['post'])
    def mark_picked_up(self, request, pk=None):
        """Lastiği teslim edildi olarak işaretle"""
        stored_tire = self.get_object()
        
        if not stored_tire.is_active:
            return Response(
                {'error': 'Bu lastik zaten teslim edilmiş.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        stored_tire.actual_pickup_date = timezone.now()
        stored_tire.is_active = False
        stored_tire.save()
        
        return Response({
            'message': 'Lastik başarıyla teslim edildi olarak işaretlendi.',
            'pickup_date': stored_tire.actual_pickup_date
        })
    
    @action(detail=False, methods=['get'])
    def overdue_pickups(self, request):
        """Vadesi geçen lastikler"""
        user = request.user
        if not user.company or not user.company.is_wholesaler():
            return Response(
                {'error': 'Bu işlem sadece toptancılar için geçerlidir.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        today = timezone.now().date()
        overdue_tires = StoredTire.objects.filter(
            customer__wholesaler=user.company,
            is_active=True,
            planned_pickup_date__lt=today
        ).select_related('customer').order_by('planned_pickup_date')
        
        serializer = StoredTireSerializer(overdue_tires, many=True)
        return Response(serializer.data)