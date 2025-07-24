from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import Warehouse, StockItem
from .serializers import (
    WarehouseSerializer,
    WarehouseCreateUpdateSerializer,
    StockItemSerializer,
    StockItemCreateUpdateSerializer,
    StockMovementSerializer,
    WarehouseSummarySerializer,
    StockSummarySerializer
)
from products.models import Product


class WarehouseViewSet(viewsets.ModelViewSet):
    """
    Depo yönetimi ViewSet
    GET /api/v1/inventory/warehouses/ - Depo listesi
    POST /api/v1/inventory/warehouses/ - Yeni depo oluştur
    GET /api/v1/inventory/warehouses/{id}/ - Depo detayı
    PUT/PATCH /api/v1/inventory/warehouses/{id}/ - Depo güncelle
    DELETE /api/v1/inventory/warehouses/{id}/ - Depo sil
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Kullanıcının sadece kendi şirketinin depolarını görmesini sağlar"""
        if hasattr(self.request.user, 'company') and self.request.user.company:
            return Warehouse.objects.filter(
                company=self.request.user.company
            ).select_related('company').prefetch_related('stock_items')
        return Warehouse.objects.none()
    
    def get_serializer_class(self):
        """Action'a göre uygun serializer seçer"""
        if self.action in ['create', 'update', 'partial_update']:
            return WarehouseCreateUpdateSerializer
        return WarehouseSerializer
    
    def perform_create(self, serializer):
        """Depo oluştururken şirketi otomatik atar"""
        serializer.save(company=self.request.user.company)
    
    def create(self, request, *args, **kwargs):
        """Yeni depo oluşturma"""
        if not hasattr(request.user, 'company') or not request.user.company:
            return Response(
                {'error': 'Depo oluşturmak için bir şirkete bağlı olmalısınız.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Response için detaylı serializer kullan
        response_serializer = WarehouseSerializer(
            serializer.instance,
            context={'request': request}
        )
        
        return Response({
            'message': 'Depo başarıyla oluşturuldu.',
            'warehouse': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Depo güncelleme"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Response için detaylı serializer kullan
        response_serializer = WarehouseSerializer(
            serializer.instance,
            context={'request': request}
        )
        
        return Response({
            'message': 'Depo başarıyla güncellendi.',
            'warehouse': response_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Depo silme (soft delete)"""
        instance = self.get_object()
        warehouse_name = instance.name
        
        # Depoda aktif stok var mı kontrol et
        active_stock_count = instance.stock_items.filter(
            quantity__gt=0,
            is_active=True
        ).count()
        
        if active_stock_count > 0:
            return Response({
                'error': f'Depoda {active_stock_count} adet aktif stok bulunmakta. Önce stokları temizleyin.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Soft delete
        instance.is_active = False
        instance.save()
        
        return Response({
            'message': f'{warehouse_name} deposu başarıyla pasif duruma alındı.'
        })
    
    @action(detail=True, methods=['get'])
    def stock_summary(self, request, pk=None):
        """
        Belirli bir deponun stok özeti
        GET /api/v1/inventory/warehouses/{id}/stock_summary/
        """
        warehouse = self.get_object()
        
        stock_items = warehouse.stock_items.select_related('product').filter(is_active=True)
        
        total_products = stock_items.count()
        total_quantity = sum(item.quantity for item in stock_items)
        total_value = sum(item.get_total_value() for item in stock_items)
        low_stock_items = sum(1 for item in stock_items if item.is_low_stock())
        out_of_stock_items = sum(1 for item in stock_items if item.is_out_of_stock())
        
        summary = {
            'warehouse': {
                'id': warehouse.id,
                'name': warehouse.name,
                'code': warehouse.code
            },
            'stock_summary': {
                'total_products': total_products,
                'total_quantity': total_quantity,
                'total_value': str(total_value),
                'low_stock_items': low_stock_items,
                'out_of_stock_items': out_of_stock_items,
                'stock_items': StockItemSerializer(
                    stock_items,
                    many=True,
                    context={'request': request}
                ).data
            }
        }
        
        return Response(summary)


class StockItemViewSet(viewsets.ModelViewSet):
    """
    Stok kalemi yönetimi ViewSet
    GET /api/v1/inventory/stock-items/ - Stok listesi
    POST /api/v1/inventory/stock-items/ - Yeni stok kalemi oluştur
    GET /api/v1/inventory/stock-items/{id}/ - Stok detayı
    PUT/PATCH /api/v1/inventory/stock-items/{id}/ - Stok güncelle
    DELETE /api/v1/inventory/stock-items/{id}/ - Stok sil
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Kullanıcının sadece kendi depolarındaki stokları görmesini sağlar"""
        if hasattr(self.request.user, 'company') and self.request.user.company:
            queryset = StockItem.objects.filter(
                warehouse__company=self.request.user.company
            ).select_related(
                'product',
                'product__category',
                'warehouse'
            )
            
            # Filtreleme parametreleri
            warehouse_id = self.request.query_params.get('warehouse')
            product_id = self.request.query_params.get('product')
            stock_status = self.request.query_params.get('status')
            search = self.request.query_params.get('search')
            
            if warehouse_id:
                queryset = queryset.filter(warehouse_id=warehouse_id)
            
            if product_id:
                queryset = queryset.filter(product_id=product_id)
            
            if search:
                queryset = queryset.filter(
                    Q(product__name__icontains=search) |
                    Q(product__sku__icontains=search) |
                    Q(product__brand__icontains=search) |
                    Q(location_code__icontains=search)
                )
            
            # Stok durumuna göre filtreleme
            if stock_status == 'low':
                # Django ORM ile low stock filtreleme biraz karmaşık olacağı için
                # Python seviyesinde filtreleme yapacağız
                pass
            elif stock_status == 'out':
                queryset = queryset.filter(quantity=0)
            elif stock_status == 'normal':
                queryset = queryset.filter(quantity__gt=0)
            
            return queryset.order_by('-updated_at')
        
        return StockItem.objects.none()
    
    def get_serializer_class(self):
        """Action'a göre uygun serializer seçer"""
        if self.action in ['create', 'update', 'partial_update']:
            return StockItemCreateUpdateSerializer
        return StockItemSerializer
    
    def create(self, request, *args, **kwargs):
        """Yeni stok kalemi oluşturma"""
        if not hasattr(request.user, 'company') or not request.user.company:
            return Response(
                {'error': 'Stok oluşturmak için bir şirkete bağlı olmalısınız.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            # Validasyon hatalarını daha detaylı yazdır
            print(f"Validation Error: {serializer.errors}")
            return Response({
                'error': 'Validasyon hatası oluştu.',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Giriş tarihini ayarla
            with transaction.atomic():
                stock_item = serializer.save()
                stock_item.last_inbound_date = timezone.now()
                stock_item.save()
        except Exception as e:
            print(f"Save Error: {str(e)}")
            return Response({
                'error': 'Stok kalemi kaydedilirken hata oluştu.',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Response için detaylı serializer kullan
        response_serializer = StockItemSerializer(
            stock_item,
            context={'request': request}
        )
        
        return Response({
            'message': 'Stok kalemi başarıyla oluşturuldu.',
            'stock_item': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Stok kalemi güncelleme"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_quantity = instance.quantity
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            stock_item = serializer.save()
            
            # Miktar değiştiyse son hareket tarihlerini güncelle
            new_quantity = stock_item.quantity
            if new_quantity != old_quantity:
                if new_quantity > old_quantity:
                    stock_item.last_inbound_date = timezone.now()
                else:
                    stock_item.last_outbound_date = timezone.now()
                stock_item.save()
        
        # Response için detaylı serializer kullan
        response_serializer = StockItemSerializer(
            stock_item,
            context={'request': request}
        )
        
        return Response({
            'message': 'Stok kalemi başarıyla güncellendi.',
            'stock_item': response_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Stok kalemi silme"""
        instance = self.get_object()
        product_name = instance.product.name
        warehouse_name = instance.warehouse.name
        
        # Rezerve miktarı var mı kontrol et
        if instance.reserved_quantity > 0:
            return Response({
                'error': f'Bu stok kaleminde {instance.reserved_quantity} adet rezerve miktar bulunmakta. Önce rezervasyonları iptal edin.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        instance.delete()
        
        return Response({
            'message': f'{product_name} - {warehouse_name} stok kalemi başarıyla silindi.'
        })
    
    @action(detail=True, methods=['post'])
    def stock_movement(self, request, pk=None):
        """
        Stok hareketi (giriş/çıkış) kaydetme
        POST /api/v1/inventory/stock-items/{id}/stock_movement/
        """
        stock_item = self.get_object()
        serializer = StockMovementSerializer(
            data=request.data,
            context={'stock_item': stock_item}
        )
        serializer.is_valid(raise_exception=True)
        
        movement_type = serializer.validated_data['movement_type']
        quantity = serializer.validated_data['quantity']
        note = serializer.validated_data.get('note', '')
        
        with transaction.atomic():
            if movement_type == 'inbound':
                stock_item.quantity += quantity
                stock_item.last_inbound_date = timezone.now()
            elif movement_type == 'outbound':
                if quantity > stock_item.get_available_quantity():
                    return Response({
                        'error': 'Yetersiz stok miktarı.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                stock_item.quantity -= quantity
                stock_item.last_outbound_date = timezone.now()
            elif movement_type == 'adjustment':
                stock_item.quantity = quantity
            
            stock_item.save()
        
        # TODO: StockMovement modeli oluşturulduğunda hareket kaydı burada yapılacak
        
        return Response({
            'message': f'Stok hareketi başarıyla kaydedildi.',
            'movement_type': movement_type,
            'quantity': quantity,
            'new_stock_quantity': stock_item.quantity,
            'note': note
        })
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Düşük stok listesi
        GET /api/v1/inventory/stock-items/low_stock/
        """
        queryset = self.get_queryset().filter(is_active=True)
        
        # Python seviyesinde low stock filtreleme
        low_stock_items = [
            item for item in queryset
            if item.is_low_stock() and not item.is_out_of_stock()
        ]
        
        serializer = self.get_serializer(low_stock_items, many=True)
        
        return Response({
            'count': len(low_stock_items),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """
        Stokta olmayan ürünler listesi
        GET /api/v1/inventory/stock-items/out_of_stock/
        """
        queryset = self.get_queryset().filter(
            quantity=0,
            is_active=True
        )
        
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_summary(request):
    """
    Kullanıcının genel envanter özeti
    GET /api/v1/inventory/summary/
    """
    if not hasattr(request.user, 'company') or not request.user.company:
        return Response({
            'error': 'Envanter bilgisi alabilmek için bir şirkete bağlı olmalısınız.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    company = request.user.company
    
    # Depo istatistikleri
    warehouses = Warehouse.objects.filter(company=company, is_active=True)
    total_warehouses = warehouses.count()
    
    # Stok istatistikleri
    stock_items = StockItem.objects.filter(
        warehouse__company=company,
        is_active=True
    ).select_related('product', 'warehouse')
    
    total_products = stock_items.count()
    total_quantity = sum(item.quantity for item in stock_items)
    total_value = sum(item.get_total_value() for item in stock_items)
    
    # Depo bazında özet
    warehouse_summaries = []
    for warehouse in warehouses:
        warehouse_stock_items = stock_items.filter(warehouse=warehouse)
        
        warehouse_products = warehouse_stock_items.count()
        warehouse_quantity = sum(item.quantity for item in warehouse_stock_items)
        warehouse_value = sum(item.get_total_value() for item in warehouse_stock_items)
        warehouse_low_stock = sum(1 for item in warehouse_stock_items if item.is_low_stock())
        warehouse_out_of_stock = sum(1 for item in warehouse_stock_items if item.is_out_of_stock())
        
        warehouse_summaries.append({
            'warehouse_id': warehouse.id,
            'warehouse_name': warehouse.name,
            'warehouse_code': warehouse.code,
            'total_products': warehouse_products,
            'total_quantity': warehouse_quantity,
            'total_value': warehouse_value,
            'low_stock_items': warehouse_low_stock,
            'out_of_stock_items': warehouse_out_of_stock
        })
    
    summary = {
        'company': {
            'id': company.id,
            'name': company.name,
            'type': company.company_type
        },
        'inventory_summary': {
            'total_warehouses': total_warehouses,
            'active_warehouses': total_warehouses,
            'total_products': total_products,
            'total_quantity': total_quantity,
            'total_value': str(total_value),
            'low_stock_items': sum(1 for item in stock_items if item.is_low_stock()),
            'out_of_stock_items': sum(1 for item in stock_items if item.is_out_of_stock())
        },
        'warehouses': warehouse_summaries
    }
    
    return Response(summary)