# backend/products/serializers.py

from rest_framework import serializers
from .models import Product, Category, Attribute, ProductAttributeValue

class CategorySerializer(serializers.ModelSerializer):
    """
    Kategori serializer
    """
    children = serializers.SerializerMethodField()
    full_path = serializers.CharField(source='get_full_path', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'parent', 'full_path', 'children', 'sort_order', 'is_active']
        read_only_fields = ['id', 'full_path', 'children']
    
    def get_children(self, obj):
        """Alt kategorileri döndürür"""
        children = obj.children.filter(is_active=True).order_by('sort_order', 'name')
        return CategoryBasicSerializer(children, many=True).data


class CategoryBasicSerializer(serializers.ModelSerializer):
    """
    Temel kategori bilgileri için serializer
    """
    full_path = serializers.CharField(source='get_full_path', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'full_path', 'parent']
        read_only_fields = ['id', 'full_path']

class AttributeSerializer(serializers.ModelSerializer):
    """
    Attribute model için serializer.
    """
    class Meta:
        model = Attribute
        fields = [
            'id',
            'name',
            'attribute_type',
            'unit',
            'choices',
            'is_required',
            'is_active',
            'categories' # Add categories field
        ]

class ProductAttributeValueSerializer(serializers.ModelSerializer):
    """
    ProductAttributeValue model için serializer.
    """
    attribute_name = serializers.CharField(source='attribute.name', read_only=True)
    attribute_type = serializers.CharField(source='attribute.attribute_type', read_only=True)
    attribute_unit = serializers.CharField(source='attribute.unit', read_only=True)
    value = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttributeValue
        fields = [
            'id',
            'attribute',
            'attribute_name',
            'attribute_type',
            'attribute_unit',
            'value_text',
            'value_number',
            'value_boolean',
            'value'
        ]

    def get_value(self, obj):
        return obj.get_value()

class ProductSerializer(serializers.ModelSerializer):
    """
    Ürün detay serializer
    """
    category_details = CategoryBasicSerializer(source='category', read_only=True)
    category_path = serializers.CharField(source='get_category_path', read_only=True)
    tire_size = serializers.CharField(source='get_tire_size', read_only=True)
    attribute_values = ProductAttributeValueSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'category', 'category_details', 'category_path',
            'sku', 'barcode', 'brand', 'model',
            'tire_width', 'tire_aspect_ratio', 'tire_diameter', 'tire_size',
            'battery_ampere', 'battery_voltage',
            'rim_size', 'rim_bolt_pattern',
            'is_active', 'is_digital', 'requires_shipping',
            'weight', 'dimensions_length', 'dimensions_width', 'dimensions_height',
            'attribute_values',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'category_details', 'category_path', 'tire_size', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """
    Ürün liste görünümü için serializer
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_path = serializers.CharField(source='get_category_path', read_only=True)
    tire_size = serializers.CharField(source='get_tire_size', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'brand', 'model',
            'category', 'category_name', 'category_path',
            'tire_width', 'tire_aspect_ratio', 'tire_diameter', 'tire_size',
            'battery_ampere', 'battery_voltage',
            'rim_size', 'rim_bolt_pattern',
            'is_active'
        ]
        read_only_fields = ['id', 'category_name', 'category_path', 'tire_size']
