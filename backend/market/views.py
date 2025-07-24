from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Avg, Count, F, Case, When, Value, DecimalField
from django.db.models.functions import Coalesce
from django.core.cache import cache
from django.conf import settings
from decimal import Decimal
import hashlib

from products.models import Product, Category
from inventory.models import StockItem
from companies.models import Company, RetailerWholesaler
from subscriptions.permissions import HasMarketplaceAccess, HasDynamicPricing
from .serializers import (
    MarketProductSerializer, 
    MarketProductFilterSerializer,
    MarketplaceStatsSerializer
)


class MarketProductListView(generics.ListAPIView):
    """
    B2B Pazaryeri ürün listesi API'si
    
    Dinamik fiyatlandırma ile toptancı ürünlerini listeler.
    Sadece aboneliği olan ve pazaryeri erişimi bulunan kullanıcılar erişebilir.
    
    GET /api/v1/market/products/
    """
    serializer_class = MarketProductSerializer
    permission_classes = [IsAuthenticated, HasMarketplaceAccess, HasDynamicPricing]
    
    def get_queryset(self):
        """
        Optimize edilmiş queryset - select_related ve prefetch_related kullanır
        """
        user_company = self.request.user.company
        
        # Temel queryset - sadece stokta olan ürünler
        queryset = Product.objects.filter(
            is_active=True,
            stock_items__quantity__gt=0,
            stock_items__is_active=True,
            stock_items__is_sellable=True,
            stock_items__warehouse__is_active=True,
            stock_items__warehouse__company__company_type__in=['wholesaler', 'both']
        ).select_related(
            'category'
        ).prefetch_related(
            'attribute_values__attribute',
            'stock_items__warehouse__company'
        ).distinct()
        
        # Stok ve fiyat hesaplamaları için annotate
        queryset = queryset.annotate(
            total_stock=Sum('stock_items__quantity'),
            available_stock=Sum(
                F('stock_items__quantity') - F('stock_items__reserved_quantity')
            ),
            avg_sale_price=Avg('stock_items__sale_price')
        )
        
        # Her ürün için en iyi stok kalemini belirle (en düşük fiyatlı)
        # Bu SubQuery ile yapılabilir ama performans için ayrı method kullanacağız
        
        return queryset
    
    def get_serializer_context(self):
        """Serializer'a ek context bilgileri ekle"""
        context = super().get_serializer_context()
        
        # Her ürün için en iyi stok kalemini önceden hesapla
        queryset = self.get_queryset()
        best_stock_items = {}
        
        for product in queryset:
            # Her ürün için en düşük fiyatlı stok kalemini bul
            best_stock = product.stock_items.filter(
                quantity__gt=0,
                is_active=True,
                is_sellable=True,
                warehouse__is_active=True,
                sale_price__isnull=False
            ).select_related('warehouse__company').order_by('sale_price').first()
            
            if best_stock:
                best_stock_items[product.id] = best_stock
                # Product nesnesine ekle (serializer'da kullanmak için)
                product.best_stock_item = best_stock
        
        context['best_stock_items'] = best_stock_items
        return context
    
    def list(self, request, *args, **kwargs):
        """
        Liste endpoint'i - filtreleme ve önbellekleme ile
        """
        # Filtreleme parametrelerini validate et
        filter_serializer = MarketProductFilterSerializer(data=request.query_params)
        filter_serializer.is_valid(raise_exception=True)
        filters = filter_serializer.validated_data
        
        # Cache key oluştur
        cache_key = self._generate_cache_key(request.user.company.id, filters)
        
        # Cache'den kontrol et
        cached_response = cache.get(cache_key)
        if cached_response and not settings.DEBUG:
            return Response(cached_response)
        
        # Queryset'i filtrele
        queryset = self.filter_queryset(self.get_queryset())
        queryset = self._apply_custom_filters(queryset, filters)
        
        # Sayfalama
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_response = self.get_paginated_response(serializer.data)
            
            # Cache'e kaydet (5 dakika)
            cache.set(cache_key, paginated_response.data, 300)
            return paginated_response
        
        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data
        
        # Cache'e kaydet
        cache.set(cache_key, response_data, 300)
        return Response(response_data)
    
    def _apply_custom_filters(self, queryset, filters):
        """Özel filtreleri uygula"""
        
        # Kategori filtresi
        if filters.get('category'):
            queryset = queryset.filter(category_id=filters['category'])
        
        # Marka filtresi
        if filters.get('brand'):
            queryset = queryset.filter(brand__icontains=filters['brand'])
        
        # Fiyat aralığı filtresi (ortalama fiyat üzerinden)
        if filters.get('min_price'):
            queryset = queryset.filter(avg_sale_price__gte=filters['min_price'])
        if filters.get('max_price'):
            queryset = queryset.filter(avg_sale_price__lte=filters['max_price'])
        
        # Sadece stokta olanlar
        if filters.get('in_stock', True):
            queryset = queryset.filter(total_stock__gt=0)
        
        # Sadece bilinen toptancıların ürünleri
        if filters.get('known_wholesalers_only'):
            user_company = self.request.user.company
            known_wholesaler_ids = RetailerWholesaler.objects.filter(
                retailer=user_company,
                is_active=True
            ).values_list('wholesaler_id', flat=True)
            
            queryset = queryset.filter(
                stock_items__warehouse__company_id__in=known_wholesaler_ids
            )
        
        # Arama
        if filters.get('search'):
            search_term = filters['search']
            queryset = queryset.filter(
                Q(name__icontains=search_term) |
                Q(brand__icontains=search_term) |
                Q(sku__icontains=search_term) |
                Q(model__icontains=search_term)
            )
        
        # Sıralama
        ordering = filters.get('ordering', '-created_at')
        if ordering == 'final_price':
            # Final price'a göre sıralama için avg_sale_price kullan
            queryset = queryset.order_by('avg_sale_price')
        elif ordering == '-final_price':
            queryset = queryset.order_by('-avg_sale_price')
        else:
            queryset = queryset.order_by(ordering)
        
        return queryset
    
    def _generate_cache_key(self, company_id, filters):
        """Cache key oluşturur"""
        # Filtreleri string'e çevir ve hash'le
        filter_string = str(sorted(filters.items()))
        filter_hash = hashlib.md5(filter_string.encode()).hexdigest()[:8]
        
        return f"market_products_{company_id}_{filter_hash}"


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasMarketplaceAccess])
def marketplace_stats(request):
    """
    Pazaryeri genel istatistikleri
    
    GET /api/v1/market/stats/
    """
    user_company = request.user.company
    
    # Cache key
    cache_key = f"marketplace_stats_{user_company.id}"
    
    # Cache'den kontrol et
    cached_stats = cache.get(cache_key)
    if cached_stats and not settings.DEBUG:
        return Response(cached_stats)
    
    # İstatistikleri hesapla
    stats = {}
    
    # Toplam ürün sayısı (stokta olanlar)
    stats['total_products'] = Product.objects.filter(
        is_active=True,
        stock_items__quantity__gt=0,
        stock_items__is_active=True,
        stock_items__warehouse__company__company_type__in=['wholesaler', 'both']
    ).distinct().count()
    
    # Toplam toptancı sayısı
    stats['total_wholesalers'] = Company.objects.filter(
        company_type__in=['wholesaler', 'both'],
        is_active=True,
        warehouses__stock_items__quantity__gt=0
    ).distinct().count()
    
    # Kullanıcının bildiği toptancı sayısı
    stats['known_wholesalers'] = RetailerWholesaler.objects.filter(
        retailer=user_company,
        is_active=True
    ).count()
    
    # Stokta olan ürün sayısı
    stats['products_in_stock'] = stats['total_products']  # Zaten filtreledik
    
    # Ortalama iskonto oranı (basit hesaplama)
    stats['average_discount'] = Decimal('5.0')  # Şimdilik sabit
    
    # Kategori sayısı
    stats['categories_count'] = Category.objects.filter(
        products__stock_items__quantity__gt=0,
        products__is_active=True
    ).distinct().count()
    
    # Potansiyel tasarruf (örnek hesaplama)
    # Bu daha karmaşık bir hesaplama olacak
    stats['your_potential_savings'] = Decimal('15000.00')  # Şimdilik örnek
    
    # Serialize et
    serializer = MarketplaceStatsSerializer(stats)
    response_data = serializer.data
    
    # Cache'e kaydet (10 dakika)
    cache.set(cache_key, response_data, 600)
    
    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasMarketplaceAccess])
def product_detail(request, product_id):
    """
    Pazaryeri ürün detayı
    
    GET /api/v1/market/products/{id}/
    """
    try:
        product = Product.objects.select_related('category').prefetch_related(
            'attribute_values__attribute',
            'stock_items__warehouse__company'
        ).get(
            id=product_id,
            is_active=True,
            stock_items__quantity__gt=0
        )
    except Product.DoesNotExist:
        return Response(
            {'error': 'Ürün bulunamadı veya stokta yok.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # En iyi stok kalemini ekle
    best_stock = product.stock_items.filter(
        quantity__gt=0,
        is_active=True,
        is_sellable=True,
        warehouse__is_active=True,
        sale_price__isnull=False
    ).select_related('warehouse__company').order_by('sale_price').first()
    
    if best_stock:
        product.best_stock_item = best_stock
    
    # Ek detay bilgileri
    product.total_stock = product.stock_items.aggregate(
        total=Sum('quantity')
    )['total'] or 0
    
    product.available_stock = product.stock_items.aggregate(
        available=Sum(F('quantity') - F('reserved_quantity'))
    )['available'] or 0
    
    product.avg_sale_price = product.stock_items.aggregate(
        avg_price=Avg('sale_price')
    )['avg_price']
    
    serializer = MarketProductSerializer(
        product, 
        context={'request': request}
    )
    
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasMarketplaceAccess])
def clear_marketplace_cache(request):
    """
    Pazaryeri cache'ini temizler (admin/debug için)
    
    POST /api/v1/market/clear-cache/
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Bu işlem için yetkiniz yok.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Tüm market cache'lerini temizle
    cache_pattern = f"market_*"
    cache.delete_pattern(cache_pattern)
    
    return Response({
        'message': 'Pazaryeri cache\'i başarıyla temizlendi.'
    })