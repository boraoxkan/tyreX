#!/usr/bin/env python
import os
import sys
import django

# Django ayarlarını yükle
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from products.models import Category, Product
from inventory.models import Warehouse
from companies.models import Company
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()

def create_test_data():
    print("=== Test Verilerini Oluşturuyor ===")
    
    # 1. Kategoriler oluştur
    print("\n1. Kategoriler oluşturuluyor...")
    
    # Ana kategoriler
    lastik_cat, _ = Category.objects.get_or_create(
        name='Lastik',
        defaults={
            'slug': 'lastik',
            'parent': None,
            'is_active': True
        }
    )
    print(f"✓ {lastik_cat.name}")
    
    aku_cat, _ = Category.objects.get_or_create(
        name='Akü',
        defaults={
            'slug': 'aku',
            'parent': None,
            'is_active': True
        }
    )
    print(f"✓ {aku_cat.name}")
    
    jant_cat, _ = Category.objects.get_or_create(
        name='Jant',
        defaults={
            'slug': 'jant',
            'parent': None,
            'is_active': True
        }
    )
    print(f"✓ {jant_cat.name}")
    
    # Alt kategoriler
    binek_lastik, _ = Category.objects.get_or_create(
        name='Binek Araç Lastik',
        defaults={
            'slug': 'binek-arac-lastik',
            'parent': lastik_cat,
            'is_active': True
        }
    )
    print(f"  ✓ {binek_lastik.name}")
    
    kamyon_lastik, _ = Category.objects.get_or_create(
        name='Kamyon Lastik',
        defaults={
            'slug': 'kamyon-lastik',
            'parent': lastik_cat,
            'is_active': True
        }
    )
    print(f"  ✓ {kamyon_lastik.name}")
    
    # 2. Demo şirket için depo kontrol et
    print("\n2. Demo depolar kontrol ediliyor...")
    
    # PRO demo şirketi al
    try:
        pro_company = Company.objects.get(name='Güven Oto Lastik')
        
        # Ana depo oluştur/kontrol et
        ana_depo, created = Warehouse.objects.get_or_create(
            company=pro_company,
            code='ANA001',
            defaults={
                'name': 'Ana Depo',
                'address': 'Sanayi Mahallesi 1. Sokak No: 15',
                'city': 'İstanbul',
                'postal_code': '34000',
                'phone': '0212 555 01 01',
                'email': 'depo@guvenotolastik.com',
                'manager_name': 'Mehmet Yılmaz',
                'total_area': 2500.0,
                'storage_capacity': 10000,
                'warehouse_type': 'main',
                'is_active': True
            }
        )
        print(f"✓ {ana_depo.name} ({'oluşturuldu' if created else 'mevcut'})")
        
        # Şube depo oluştur
        sube_depo, created = Warehouse.objects.get_or_create(
            company=pro_company,
            code='SUBE001',
            defaults={
                'name': 'Şube Deposu',
                'address': 'Merkez Mahallesi 5. Cadde No: 42',
                'city': 'Ankara',
                'postal_code': '06000',
                'phone': '0312 555 02 02',
                'manager_name': 'Ali Özkan',
                'storage_capacity': 5000,
                'warehouse_type': 'distribution',
                'is_active': True
            }
        )
        print(f"✓ {sube_depo.name} ({'oluşturuldu' if created else 'mevcut'})")
        
    except Company.DoesNotExist:
        print("❌ PRO demo şirketi bulunamadı!")
    
    # 3. Test ürünleri oluştur
    print("\n3. Test ürünleri oluşturuluyor...")
    
    # Lastik ürünleri
    lastik_products = [
        {
            'name': 'Michelin Primacy 4',
            'sku': 'MICH-P4-195/65R15',
            'slug': 'michelin-primacy-4-195-65r15',
            'brand': 'Michelin',
            'category': binek_lastik,
            'tire_width': '195',
            'tire_aspect_ratio': '65',
            'tire_diameter': '15',
            'description': 'Yüksek performanslı binek araç lastiği',
            'is_active': True
        },
        {
            'name': 'Bridgestone Turanza T001',
            'sku': 'BRDG-T001-205/55R16',
            'slug': 'bridgestone-turanza-t001-205-55r16',
            'brand': 'Bridgestone',
            'category': binek_lastik,
            'tire_width': '205',
            'tire_aspect_ratio': '55',
            'tire_diameter': '16',
            'description': 'Konfor odaklı premium lastik',
            'is_active': True
        },
        {
            'name': 'Goodyear EfficientGrip',
            'sku': 'GOOD-EG-225/50R17',
            'slug': 'goodyear-efficientgrip-225-50r17',
            'brand': 'Goodyear',
            'category': binek_lastik,
            'tire_width': '225',
            'tire_aspect_ratio': '50',
            'tire_diameter': '17',
            'description': 'Yakıt tasarruflu lastik',
            'is_active': True
        }
    ]
    
    for product_data in lastik_products:
        product, created = Product.objects.get_or_create(
            sku=product_data['sku'],
            defaults=product_data
        )
        print(f"✓ {product.name} ({'oluşturuldu' if created else 'mevcut'})")
    
    # Akü ürünleri
    aku_products = [
        {
            'name': 'Varta Blue Dynamic E11',
            'sku': 'VARTA-BD-E11-74AH',
            'slug': 'varta-blue-dynamic-e11-74ah',
            'brand': 'Varta',
            'category': aku_cat,
            'battery_ampere': '74',
            'battery_voltage': '12V',
            'description': '74 Ah 12V Akü',
            'is_active': True
        },
        {
            'name': 'Bosch S4 005',
            'sku': 'BOSCH-S4-005-60AH',
            'slug': 'bosch-s4-005-60ah',
            'brand': 'Bosch',
            'category': aku_cat,
            'battery_ampere': '60',
            'battery_voltage': '12V',
            'description': '60 Ah 12V Akü',
            'is_active': True
        }
    ]
    
    for product_data in aku_products:
        product, created = Product.objects.get_or_create(
            sku=product_data['sku'],
            defaults=product_data
        )
        print(f"✓ {product.name} ({'oluşturuldu' if created else 'mevcut'})")
    
    # Jant ürünleri
    jant_products = [
        {
            'name': 'OZ Racing Superturismo',
            'sku': 'OZ-ST-17X7-5X112',
            'slug': 'oz-racing-superturismo-17x7-5x112',
            'brand': 'OZ Racing',
            'category': jant_cat,
            'rim_size': '17x7',
            'rim_bolt_pattern': '5x112',
            'description': '17x7 5x112 Jant',
            'is_active': True
        },
        {
            'name': 'BBS CH-R',
            'sku': 'BBS-CHR-18X8-5X120',
            'slug': 'bbs-ch-r-18x8-5x120',
            'brand': 'BBS',
            'category': jant_cat,
            'rim_size': '18x8',
            'rim_bolt_pattern': '5x120',
            'description': '18x8 5x120 Jant',
            'is_active': True
        }
    ]
    
    for product_data in jant_products:
        product, created = Product.objects.get_or_create(
            sku=product_data['sku'],
            defaults=product_data
        )
        print(f"✓ {product.name} ({'oluşturuldu' if created else 'mevcut'})")
    
    print(f"\n✅ Test verileri başarıyla oluşturuldu!")
    print(f"📊 Toplam kategori: {Category.objects.count()}")
    print(f"📦 Toplam ürün: {Product.objects.count()}")
    print(f"🏪 Toplam depo: {Warehouse.objects.count()}")

if __name__ == '__main__':
    create_test_data()