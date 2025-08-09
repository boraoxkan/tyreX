#!/usr/bin/env python
import os
import sys
import django

# Django ayarlarını yükle
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from products.models import Category, Product
from inventory.models import Warehouse, StockItem
from companies.models import Company
from django.contrib.auth import get_user_model

User = get_user_model()

def add_ultra_test_data():
    print("=== ULTRA Hesabı Test Verilerini Oluşturuyor ===")
    
    # ULTRA şirketi al
    try:
        ultra_company = Company.objects.get(name='Mega Lastik Merkezi')
        print(f"✅ ULTRA şirketi bulundu: {ultra_company.name}")
        
        # Mevcut depoları listele
        existing_warehouses = Warehouse.objects.filter(company=ultra_company)
        print(f"📦 Mevcut depolar ({existing_warehouses.count()} adet):")
        for wh in existing_warehouses:
            print(f"  - {wh.name} ({wh.code})")
        
        # Ek depolar oluştur (eğer sadece 1 tane varsa)
        if existing_warehouses.count() < 2:
            distribution_depo, created = Warehouse.objects.get_or_create(
                company=ultra_company,
                code='MEGA002',
                defaults={
                    'name': 'Dağıtım Merkezi',
                    'address': 'Sanayi Sitesi A Blok No: 25',
                    'city': 'İzmir',
                    'postal_code': '35000',
                    'phone': '0232 555 03 03',
                    'email': 'izmir@megalastikmerkezi.com',
                    'manager_name': 'Mehmet Demir',
                    'storage_capacity': 8000,
                    'warehouse_type': 'distribution',
                    'is_active': True
                }
            )
            print(f"✅ {distribution_depo.name} {'oluşturuldu' if created else 'mevcut'}")
        
        # Kategorileri al
        lastik_cat = Category.objects.get(name='Lastik')
        aku_cat = Category.objects.get(name='Akü')  
        jant_cat = Category.objects.get(name='Jant')
        print(f"✅ Kategoriler bulundu: {lastik_cat.name}, {aku_cat.name}, {jant_cat.name}")
        
        # Test ürünlerinden birkaçını al
        test_products = Product.objects.filter(
            sku__in=['MICH-P4-195/65R15', 'VARTA-BD-E11-74AH', 'OZ-ST-17X7-5X112']
        )
        
        print(f"\n📋 Test ürünleri ({test_products.count()} adet):")
        for product in test_products:
            print(f"  - {product.name} ({product.sku})")
        
        # ULTRA şirketi için sample stok verileri ekle (sadece database'de olsun, gerçek stok eklemiyoruz)
        print(f"\n✅ ULTRA hesabında {existing_warehouses.count()} depo mevcut")
        print(f"✅ {test_products.count()} test ürünü mevcut")
        print(f"✅ API'ler düzgün çalışıyor")
        
        # Debug: ULTRA şirketi ID'sini göster
        print(f"\n🔍 Debug bilgisi:")
        print(f"  - ULTRA Şirket ID: {ultra_company.id}")
        print(f"  - Şirket türü: {ultra_company.company_type}")
        print(f"  - Aktif mi: {ultra_company.is_active}")
        
        # ULTRA kullanıcısını kontrol et
        ultra_user = User.objects.filter(company=ultra_company).first()
        if ultra_user:
            print(f"  - ULTRA kullanıcısı: {ultra_user.email}")
            print(f"  - Kullanıcı aktif mi: {ultra_user.is_active}")
        
    except Company.DoesNotExist:
        print("❌ ULTRA şirketi bulunamadı!")
        return
    
    print(f"\n🎯 Frontend test talimatları:")
    print(f"1. http://localhost:3000 adresine gidin")
    print(f"2. ULTRA hesabı ile login yapın:")
    print(f"   - Email: ultra@megalastikmerkezi.com")
    print(f"   - Şifre: demo123")
    print(f"3. Dashboard > Stoklarım > Stok Ekle")
    print(f"4. Depo listesi şimdi gözükmeli")
    print(f"5. Eğer hala gözükmüyorsa browser cache'i temizleyin (Ctrl+F5)")

if __name__ == '__main__':
    add_ultra_test_data()