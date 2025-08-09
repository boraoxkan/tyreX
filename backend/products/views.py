from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Product, Category, Attribute
from .serializers import (
    ProductSerializer, 
    ProductListSerializer,
    CategorySerializer, 
    AttributeSerializer
)

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Ürünleri listelemek ve aramak için API endpoint'i.
    Sadece aktif ürünleri döndürür.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related('attribute_values__attribute')
        
        # Filtreleme parametreleri
        category_id = self.request.query_params.get('category')
        brand = self.request.query_params.get('brand')
        search = self.request.query_params.get('search')
        
        # Lastik için özel filtreler
        tire_width = self.request.query_params.get('tire_width')
        tire_aspect_ratio = self.request.query_params.get('tire_aspect_ratio') 
        tire_diameter = self.request.query_params.get('tire_diameter')
        
        # Akü için özel filtreler
        battery_ampere = self.request.query_params.get('battery_ampere')
        
        # Jant için özel filtreler
        rim_size = self.request.query_params.get('rim_size')
        rim_bolt_pattern = self.request.query_params.get('rim_bolt_pattern')

        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        if brand:
            queryset = queryset.filter(brand__icontains=brand)
            
        if tire_width:
            queryset = queryset.filter(tire_width=tire_width)
        if tire_aspect_ratio:
            queryset = queryset.filter(tire_aspect_ratio=tire_aspect_ratio)
        if tire_diameter:
            queryset = queryset.filter(tire_diameter=tire_diameter)
            
        if battery_ampere:
            queryset = queryset.filter(battery_ampere=battery_ampere)
            
        if rim_size:
            queryset = queryset.filter(rim_size=rim_size)
        if rim_bolt_pattern:
            queryset = queryset.filter(rim_bolt_pattern=rim_bolt_pattern)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(brand__icontains=search) |
                Q(category__name__icontains=search)
            )
            
        return queryset.order_by('name')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    @action(detail=False, methods=['get'])
    def brands(self, request):
        """Marka listesi"""
        category_id = request.query_params.get('category')
        queryset = self.get_queryset()
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        brands = queryset.values_list('brand', flat=True).distinct().order_by('brand')
        return Response(list(brands))
    
    @action(detail=False, methods=['get'])
    def tire_sizes(self, request):
        """Lastik ebatları"""
        brand = request.query_params.get('brand')
        category_id = request.query_params.get('category')
        
        queryset = self.get_queryset()
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if brand:
            queryset = queryset.filter(brand=brand)
            
        # Lastik kategorilerinde olan ürünleri filtrele
        queryset = queryset.filter(
            tire_width__isnull=False,
            tire_aspect_ratio__isnull=False,
            tire_diameter__isnull=False
        )
        
        sizes = []
        for product in queryset.distinct('tire_width', 'tire_aspect_ratio', 'tire_diameter'):
            if product.tire_width and product.tire_aspect_ratio and product.tire_diameter:
                sizes.append({
                    'width': product.tire_width,
                    'aspect_ratio': product.tire_aspect_ratio,
                    'diameter': product.tire_diameter,
                    'display': f"{product.tire_width}/{product.tire_aspect_ratio}/{product.tire_diameter}"
                })
        
        return Response(sizes)
    
    @action(detail=False, methods=['get'])
    def battery_capacities(self, request):
        """Akü kapasiteleri"""
        brand = request.query_params.get('brand')
        category_id = request.query_params.get('category')
        
        queryset = self.get_queryset()
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if brand:
            queryset = queryset.filter(brand=brand)
            
        capacities = queryset.filter(battery_ampere__isnull=False).values_list('battery_ampere', flat=True).distinct().order_by('battery_ampere')
        return Response(list(capacities))
    
    @action(detail=False, methods=['get'])
    def rim_specs(self, request):
        """Jant özellikleri"""
        brand = request.query_params.get('brand')
        category_id = request.query_params.get('category')
        
        queryset = self.get_queryset()
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if brand:
            queryset = queryset.filter(brand=brand)
            
        rim_sizes = queryset.filter(rim_size__isnull=False).values_list('rim_size', flat=True).distinct().order_by('rim_size')
        rim_bolt_patterns = queryset.filter(rim_bolt_pattern__isnull=False).values_list('rim_bolt_pattern', flat=True).distinct().order_by('rim_bolt_pattern')
        
        return Response({
            'sizes': list(rim_sizes),
            'bolt_patterns': list(rim_bolt_patterns)
        })

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Ürün kategorilerini listelemek için API endpoint'i.
    Sadece aktif kategorileri döndürür.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CategorySerializer
    
    def get_queryset(self):
        queryset = Category.objects.filter(is_active=True)
        parent_id = self.request.query_params.get('parent')
        
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        
        return queryset.order_by('sort_order', 'name')
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Kategori ağacını döndürür"""
        root_categories = Category.objects.filter(
            is_active=True, 
            parent__isnull=True
        ).order_by('sort_order', 'name')
        
        serializer = self.get_serializer(root_categories, many=True)
        return Response(serializer.data)

class AttributeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Ürün özelliklerini listelemek için API endpoint'i.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AttributeSerializer
    queryset = Attribute.objects.filter(is_active=True).order_by('name')
