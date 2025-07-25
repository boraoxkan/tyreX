# backend/orders/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count, Avg
from django.db import transaction
from django.utils import timezone
from subscriptions.permissions import IsSubscribed
from .models import Order, OrderItem, OrderStatusHistory
from .serializers import (
    OrderCreateSerializer,
    OrderSerializer,
    OrderListSerializer,
    OrderStatusUpdateSerializer,
    CartCalculationSerializer
)


class OrderViewSet(viewsets.ModelViewSet):
    """
    Sipariş yönetimi ViewSet
    
    GET /api/v1/orders/ - Sipariş listesi
    POST /api/v1/orders/ - Yeni sipariş oluştur
    GET /api/v1/orders/{id}/ - Sipariş detayı
    PUT/PATCH /api/v1/orders/{id}/ - Sipariş güncelle
    DELETE /api/v1/orders/{id}/ - Sipariş iptal et
    """
    permission_classes = [IsAuthenticated, IsSubscribed]
    
    def get_queryset(self):
        """Kullanıcının sadece kendi şirketinin siparişlerini görmesini sağlar"""
        if hasattr(self.request.user, 'company') and self.request.user.company:
            # Perakendeci ise verdiği siparişleri, toptancı ise aldığı siparişleri göster
            company = self.request.user.company
            
            if company.company_type in ['retailer', 'both']:
                queryset = Order.objects.filter(retailer=company)
            elif company.company_type == 'wholesaler':
                queryset = Order.objects.filter(wholesaler=company)
            else:
                return Order.objects.none()
            
            # Filtreleme parametreleri
            status_filter = self.request.query_params.get('status')
            payment_status_filter = self.request.query_params.get('payment_status')
            wholesaler_id = self.request.query_params.get('wholesaler')
            date_from = self.request.query_params.get('date_from')
            date_to = self.request.query_params.get('date_to')
            search = self.request.query_params.get('search')
            
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            if payment_status_filter:
                queryset = queryset.filter(payment_status=payment_status_filter)
            
            if wholesaler_id and company.company_type in ['retailer', 'both']:
                queryset = queryset.filter(wholesaler_id=wholesaler_id)
            
            if date_from:
                queryset = queryset.filter(order_date__gte=date_from)
            
            if date_to:
                queryset = queryset.filter(order_date__lte=date_to)
            
            if search:
                queryset = queryset.filter(
                    Q(order_number__icontains=search) |
                    Q(retailer__name__icontains=search) |
                    Q(wholesaler__name__icontains=search) |
                    Q(notes__icontains=search)
                )
            
            return queryset.select_related(
                'retailer', 'wholesaler', 'retailer_user'
            ).prefetch_related(
                'items__product', 'items__warehouse'
            ).order_by('-created_at')
        
        return Order.objects.none()
    
    def get_serializer_class(self):
        """Action'a göre uygun serializer seçer"""
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action == 'list':
            return OrderListSerializer
        elif self.action == 'update_status':
            return OrderStatusUpdateSerializer
        return OrderSerializer
    
    def create(self, request, *args, **kwargs):
        """Yeni sipariş oluşturma"""
        if not hasattr(request.user, 'company') or not request.user.company:
            return Response(
                {'error': 'Sipariş vermek için bir şirkete bağlı olmalısınız.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Sadece perakendeciler sipariş verebilir
        if request.user.company.company_type not in ['retailer', 'both']:
            return Response(
                {'error': 'Sadece perakendeci şirketler sipariş verebilir.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            order = serializer.save()
            
            # Response için detaylı serializer kullan
            response_serializer = OrderSerializer(
                order,
                context={'request': request}
            )
            
            return Response({
                'message': 'Sipariş başarıyla oluşturuldu.',
                'order': response_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': 'Sipariş oluşturulurken hata oluştu.',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        """Sipariş iptal etme (soft delete)"""
        instance = self.get_object()
        
        # İptal edilebilir mi kontrol et
        if not instance.can_be_canceled():
            return Response({
                'error': f'{instance.get_status_display()} durumundaki sipariş iptal edilemez.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Sipariş durumunu güncelle
        with transaction.atomic():
            instance.status = 'canceled'
            instance.canceled_at = timezone.now()
            instance.save(update_fields=['status', 'canceled_at'])
            
            # Stokları geri ekle
            for item in instance.items.all():
                item.stock_item.quantity += item.quantity
                item.stock_item.save(update_fields=['quantity'])
                
                item.is_canceled = True
                item.canceled_at = timezone.now()
                item.cancel_reason = 'Sipariş iptal edildi'
                item.save(update_fields=['is_canceled', 'canceled_at', 'cancel_reason'])
            
            # Durum geçmişi kaydet
            OrderStatusHistory.objects.create(
                order=instance,
                old_status=instance.status,
                new_status='canceled',
                changed_by=request.user,
                change_reason='Kullanıcı tarafından iptal edildi',
                notes=f'Toplam {instance.get_total_items()} adet ürün stokları geri alındı'
            )
        
        return Response({
            'message': f'Sipariş #{instance.order_number} başarıyla iptal edildi.'
        })
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Sipariş durumu güncelleme
        POST /api/v1/orders/{id}/update_status/
        """
        order = self.get_object()
        
        serializer = OrderStatusUpdateSerializer(
            data=request.data,
            context={'order': order}
        )
        serializer.is_valid(raise_exception=True)
        
        old_status = order.status
        new_status = serializer.validated_data['status']
        notes = serializer.validated_data.get('notes', '')
        
        with transaction.atomic():
            order.status = new_status
            
            # Özel durum güncellemeleri
            if new_status == 'confirmed':
                order.confirmed_at = timezone.now()
            elif new_status == 'shipped':
                order.shipped_at = timezone.now()
            elif new_status == 'delivered':
                order.delivered_at = timezone.now()
                order.payment_status = 'paid'  # Teslim edilen sipariş ödenmiş sayılır
            elif new_status == 'canceled':
                order.canceled_at = timezone.now()
            
            order.save()
            
            # Durum geçmişi kaydet
            OrderStatusHistory.objects.create(
                order=order,
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                change_reason='Manuel durum güncelleme',
                notes=notes
            )
        
        return Response({
            'message': f'Sipariş durumu {order.get_status_display()} olarak güncellendi.',
            'order': OrderSerializer(order, context={'request': request}).data
        })
    
    @action(detail=True, methods=['get'])
    def status_history(self, request, pk=None):
        """
        Sipariş durum geçmişi
        GET /api/v1/orders/{id}/status_history/
        """
        order = self.get_object()
        
        history = order.status_history.select_related('changed_by').order_by('-changed_at')
        
        history_data = [
            {
                'id': h.id,
                'old_status': h.old_status,
                'old_status_display': dict(Order.STATUS_CHOICES).get(h.old_status, h.old_status) if h.old_status else None,
                'new_status': h.new_status,
                'new_status_display': dict(Order.STATUS_CHOICES).get(h.new_status, h.new_status),
                'changed_by': {
                    'id': h.changed_by.id if h.changed_by else None,
                    'name': f"{h.changed_by.first_name} {h.changed_by.last_name}".strip() if h.changed_by else 'Sistem',
                    'email': h.changed_by.email if h.changed_by else None
                },
                'change_reason': h.change_reason,
                'notes': h.notes,
                'changed_at': h.changed_at
            }
            for h in history
        ]
        
        return Response({
            'order_number': order.order_number,
            'current_status': order.status,
            'history': history_data
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Sipariş özeti
        GET /api/v1/orders/summary/
        """
        queryset = self.get_queryset()
        
        # Genel istatistikler
        total_orders = queryset.count()
        total_amount = queryset.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Duruma göre dağılım
        status_summary = {}
        for status_code, status_name in Order.STATUS_CHOICES:
            count = queryset.filter(status=status_code).count()
            if count > 0:
                status_summary[status_code] = {
                    'name': status_name,
                    'count': count,
                    'percentage': round((count / total_orders * 100), 1) if total_orders > 0 else 0
                }
        
        # Son 30 günlük trend
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_orders = queryset.filter(order_date__gte=thirty_days_ago)
        
        summary = {
            'total_orders': total_orders,
            'total_amount': str(total_amount),
            'currency': 'TRY',
            'status_distribution': status_summary,
            'recent_30_days': {
                'count': recent_orders.count(),
                'amount': str(recent_orders.aggregate(total=Sum('total_amount'))['total'] or 0),
                'average_order_value': str(
                    recent_orders.aggregate(avg=Avg('total_amount'))['avg'] or 0
                )
            }
        }
        
        return Response(summary)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSubscribed])
def calculate_cart(request):
    """
    Sepet hesaplama - Sipariş vermeden önce fiyat kontrolü
    POST /api/v1/orders/calculate-cart/
    """
    if not hasattr(request.user, 'company') or not request.user.company:
        return Response(
            {'error': 'Hesaplama yapmak için bir şirkete bağlı olmalısınız.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = CartCalculationSerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    
    try:
        cart_data = serializer.calculate_cart()
        
        return Response({
            'message': 'Sepet başarıyla hesaplandı.',
            'cart': cart_data
        })
        
    except Exception as e:
        return Response({
            'error': 'Sepet hesaplanırken hata oluştu.',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_statistics(request):
    """
    Sipariş istatistikleri
    GET /api/v1/orders/statistics/
    """
    if not hasattr(request.user, 'company') or not request.user.company:
        return Response(
            {'error': 'İstatistik görüntülemek için bir şirkete bağlı olmalısınız.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    company = request.user.company
    
    # Perakendeci istatistikleri
    if company.company_type in ['retailer', 'both']:
        orders = Order.objects.filter(retailer=company)
        
        stats = {
            'role': 'retailer',
            'total_orders': orders.count(),
            'total_spent': str(orders.aggregate(total=Sum('total_amount'))['total'] or 0),
            'average_order_value': str(orders.aggregate(avg=Avg('total_amount'))['avg'] or 0),
            'orders_by_status': {},
            'top_wholesalers': [],
            'monthly_trend': []
        }
        
        # Duruma göre sipariş sayıları
        for status_code, status_name in Order.STATUS_CHOICES:
            count = orders.filter(status=status_code).count()
            if count > 0:
                stats['orders_by_status'][status_code] = {
                    'name': status_name,
                    'count': count
                }
        
        # En çok sipariş verilen toptancılar
        top_wholesalers = orders.values(
            'wholesaler__name'
        ).annotate(
            order_count=Count('id'),
            total_amount=Sum('total_amount')
        ).order_by('-order_count')[:5]
        
        stats['top_wholesalers'] = [
            {
                'name': w['wholesaler__name'],
                'order_count': w['order_count'],
                'total_amount': str(w['total_amount'])
            }
            for w in top_wholesalers
        ]
    
    # Toptancı istatistikleri
    elif company.company_type == 'wholesaler':
        orders = Order.objects.filter(wholesaler=company)
        
        stats = {
            'role': 'wholesaler',
            'total_orders': orders.count(),
            'total_revenue': str(orders.aggregate(total=Sum('total_amount'))['total'] or 0),
            'average_order_value': str(orders.aggregate(avg=Avg('total_amount'))['avg'] or 0),
            'orders_by_status': {},
            'top_retailers': [],
            'monthly_trend': []
        }
        
        # Duruma göre sipariş sayıları
        for status_code, status_name in Order.STATUS_CHOICES:
            count = orders.filter(status=status_code).count()
            if count > 0:
                stats['orders_by_status'][status_code] = {
                    'name': status_name,
                    'count': count
                }
        
        # En çok sipariş veren perakendeciler
        top_retailers = orders.values(
            'retailer__name'
        ).annotate(
            order_count=Count('id'),
            total_amount=Sum('total_amount')
        ).order_by('-order_count')[:5]
        
        stats['top_retailers'] = [
            {
                'name': r['retailer__name'],
                'order_count': r['order_count'],
                'total_amount': str(r['total_amount'])
            }
            for r in top_retailers
        ]
    
    else:
        return Response(
            {'error': 'Geçersiz şirket türü.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response(stats)