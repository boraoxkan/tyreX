#!/usr/bin/env python3
"""
Tyrex projesi için kapsamlı test verileri oluşturma scripti
Mevcut giriş bilgilerini koruyarak diğer verileri genişletir
"""
import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
import random

# Django ayarları
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.append('/app')
django.setup()

from users.models import User
from companies.models import Company, RetailerWholesaler
from products.models import Category, Product
from inventory.models import Warehouse, StockItem, PriceHistory
from subscriptions.models import SubscriptionPlan
from django.utils import timezone
from django.contrib.auth.hashers import make_password

class ComprehensiveTestDataGenerator:
    def __init__(self):
        self.brands = {
            'tire': ['Bridgestone', 'Michelin', 'Continental', 'Pirelli', 'Goodyear', 'Yokohama', 
                    'Toyo', 'Hankook', 'Kumho', 'Falken', 'BFGoodrich', 'Dunlop'],
            'battery': ['Varta', 'Bosch', 'Yuasa', 'Optima', 'AC Delco', 'Interstate', 
                       'Exide', 'DieHard', 'Odyssey', 'Duracell'],
            'rim': ['BBS', 'OZ Racing', 'Enkei', 'Rays', 'Borbet', 'AEZ', 'Dezent', 
                   'Dotz', 'Rial', 'Schmidt', 'Fondmetal', 'Momo']
        }
        
        self.tire_sizes = [
            {'width': '195', 'aspect': '65', 'diameter': '15'},
            {'width': '205', 'aspect': '55', 'diameter': '16'},
            {'width': '225', 'aspect': '45', 'diameter': '17'},
            {'width': '235', 'aspect': '40', 'diameter': '18'},
            {'width': '245', 'aspect': '35', 'diameter': '19'},
            {'width': '255', 'aspect': '30', 'diameter': '20'},
            {'width': '185', 'aspect': '60', 'diameter': '14'},
            {'width': '215', 'aspect': '50', 'diameter': '17'},
            {'width': '265', 'aspect': '35', 'diameter': '18'},
            {'width': '175', 'aspect': '70', 'diameter': '13'},
        ]
        
        self.battery_specs = [
            {'ampere': '45', 'voltage': '12V'},
            {'ampere': '55', 'voltage': '12V'},
            {'ampere': '62', 'voltage': '12V'},
            {'ampere': '70', 'voltage': '12V'},
            {'ampere': '74', 'voltage': '12V'},
            {'ampere': '80', 'voltage': '12V'},
            {'ampere': '90', 'voltage': '12V'},
            {'ampere': '100', 'voltage': '12V'},
        ]
        
        self.rim_specs = [
            {'size': '15x6', 'bolt': '4x100'},
            {'size': '16x7', 'bolt': '5x112'},
            {'size': '17x8', 'bolt': '5x120'},
            {'size': '18x8', 'bolt': '5x114.3'},
            {'size': '19x9', 'bolt': '5x130'},
            {'size': '20x10', 'bolt': '5x120'},
            {'size': '14x5.5', 'bolt': '4x108'},
            {'size': '15x6.5', 'bolt': '5x100'},
        ]

    def clear_existing_test_data(self):
        """Mevcut test verilerini temizle (kullanıcıları koru)"""
        print("🗑️ Mevcut test verileri temizleniyor...")
        
        # Stok ve fiyat geçmişini temizle
        PriceHistory.objects.all().delete()
        StockItem.objects.all().delete()
        
        # Ürün ve depoları temizle (yenilerini oluşturacağız)
        Product.objects.all().delete()
        Warehouse.objects.all().delete()
        
        # Şirket ilişkilerini temizle
        RetailerWholesaler.objects.all().delete()
        
        print("✅ Mevcut test verileri temizlendi")

    def create_additional_companies(self):
        """Ek şirketler oluştur"""
        print("🏢 Ek şirketler oluşturuluyor...")
        
        additional_companies = [
            {
                'name': 'Ankara Lastik Dünyası',
                'company_type': 'retailer',
                'email': 'info@ankaralastik.com',
                'phone': '+90 312 555 0123',
                'address': 'Kızılay Mah. Atatürk Bulvarı No:45 Çankaya/Ankara'
            },
            {
                'name': 'İzmir Oto Center',
                'company_type': 'retailer',
                'email': 'info@izmiroto.com',
                'phone': '+90 232 555 0456',
                'address': 'Alsancak Mah. Cumhuriyet Bulvarı No:123 Konak/İzmir'
            },
            {
                'name': 'Bursa Jant Merkezi',
                'company_type': 'retailer',
                'email': 'info@bursajant.com',
                'phone': '+90 224 555 0789',
                'address': 'Osmangazi Mah. Mudanya Yolu No:67 Osmangazi/Bursa'
            },
            {
                'name': 'Global Oto Toptan',
                'company_type': 'wholesaler',
                'email': 'info@globaloto.com',
                'phone': '+90 212 555 0999',
                'address': 'Oto Sanayi Sitesi A Blok No:15 Başakşehir/İstanbul'
            },
            {
                'name': 'Premier Akü Dağıtım',
                'company_type': 'wholesaler',
                'email': 'info@premieraku.com',
                'phone': '+90 216 555 0888',
                'address': 'Sanayi Mah. Üretim Cad. No:89 Kadıköy/İstanbul'
            }
        ]
        
        created_companies = []
        for comp_data in additional_companies:
            company, created = Company.objects.get_or_create(
                name=comp_data['name'],
                defaults=comp_data
            )
            if created:
                created_companies.append(company)
                print(f"✅ Şirket oluşturuldu: {company.name}")
            else:
                print(f"⚠️ Şirket zaten mevcut: {company.name}")
        
        return created_companies

    def create_additional_users(self, companies):
        """Ek kullanıcılar oluştur"""
        print("👥 Ek kullanıcılar oluşturuluyor...")
        
        user_data = [
            {
                'email': 'ankara@ankaralastik.com',
                'first_name': 'Mehmet',
                'last_name': 'Kaya',
                'company_name': 'Ankara Lastik Dünyası',
                'password': 'ankara123'
            },
            {
                'email': 'izmir@izmiroto.com',
                'first_name': 'Ayşe',
                'last_name': 'Demir',
                'company_name': 'İzmir Oto Center',
                'password': 'izmir123'
            },
            {
                'email': 'bursa@bursajant.com',
                'first_name': 'Fatma',
                'last_name': 'Şahin',
                'company_name': 'Bursa Jant Merkezi',
                'password': 'bursa123'
            },
            {
                'email': 'global@globaloto.com',
                'first_name': 'Ali',
                'last_name': 'Yılmaz',
                'company_name': 'Global Oto Toptan',
                'password': 'global123'
            },
            {
                'email': 'premier@premieraku.com',
                'first_name': 'Zeynep',
                'last_name': 'Öztürk',
                'company_name': 'Premier Akü Dağıtım',
                'password': 'premier123'
            }
        ]
        
        created_users = []
        for user_info in user_data:
            try:
                company = Company.objects.get(name=user_info['company_name'])
                user, created = User.objects.get_or_create(
                    email=user_info['email'],
                    defaults={
                        'first_name': user_info['first_name'],
                        'last_name': user_info['last_name'],
                        'company': company,
                        'password': make_password(user_info['password']),
                        'is_active': True
                    }
                )
                if created:
                    created_users.append(user)
                    print(f"✅ Kullanıcı oluşturuldu: {user.email}")
                else:
                    print(f"⚠️ Kullanıcı zaten mevcut: {user.email}")
            except Company.DoesNotExist:
                print(f"❌ Şirket bulunamadı: {user_info['company_name']}")
        
        return created_users

    def create_warehouses(self):
        """Tüm şirketler için depolar oluştur"""
        print("🏪 Depolar oluşturuluyor...")
        
        created_warehouses = []
        companies = Company.objects.all()
        
        warehouse_templates = [
            {'name': 'Ana Depo', 'code': 'A1', 'type': 'main'},
            {'name': 'Şube Deposu', 'code': 'S1', 'type': 'branch'},
            {'name': 'Mağaza Deposu', 'code': 'M1', 'type': 'retail'},
        ]
        
        for company_index, company in enumerate(companies):
            print(f"📦 {company.name} için depolar oluşturuluyor...")
            
            # Şirket türüne göre depo sayısını belirle
            if company.company_type == 'wholesaler':
                templates = warehouse_templates  # Tüm depo türleri
            else:
                templates = warehouse_templates[:2]  # Sadece ana depo ve şube deposu
            
            for i, template in enumerate(templates):
                # Benzersiz kod oluştur: şirket indexi + template kodu + depo indexi
                unique_code = f"{template['code']}{company_index + 1}{i + 1}"
                warehouse = Warehouse.objects.create(
                    company=company,
                    name=template['name'],
                    code=unique_code,
                    address=f"{company.address} - {template['name']}",
                    city=company.address.split('/')[-1] if '/' in company.address else 'İstanbul',
                    postal_code=f"0{random.randint(1000, 9999)}",
                    country='Türkiye',
                    phone=company.phone,
                    email=company.email,
                    manager_name=f"{template['name']} Müdürü",
                    total_area=random.randint(500, 5000),
                    storage_capacity=random.randint(1000, 10000),
                    warehouse_type=template['type'],
                    is_active=True,
                    accepts_inbound=True,
                    accepts_outbound=True
                )
                created_warehouses.append(warehouse)
                print(f"  ✅ {warehouse.name} ({warehouse.code})")
        
        print(f"✅ Toplam {len(created_warehouses)} depo oluşturuldu")
        return created_warehouses

    def create_products(self):
        """Çeşitli kategorilerde ürünler oluştur"""
        print("🛞 Ürünler oluşturuluyor...")
        
        # Kategorileri al
        categories = {
            'tire': Category.objects.get(name='Lastik'),
            'battery': Category.objects.get(name='Akü'),
            'rim': Category.objects.get(name='Jant'),
        }
        
        created_products = []
        
        # Lastikler
        print("🛞 Lastikler oluşturuluyor...")
        for brand in self.brands['tire']:
            for size in self.tire_sizes:
                name = f"{brand} {size['width']}/{size['aspect']}R{size['diameter']}"
                sku = f"{brand.upper()[:3]}-{size['width']}{size['aspect']}R{size['diameter']}"
                product = Product.objects.create(
                    name=name,
                    slug=f"{brand.lower().replace(' ', '-')}-{size['width']}-{size['aspect']}-r{size['diameter']}",
                    sku=sku,
                    brand=brand,
                    category=categories['tire'],
                    tire_width=size['width'],
                    tire_aspect_ratio=size['aspect'],
                    tire_diameter=size['diameter'],
                    description=f"{brand} marka {size['width']}/{size['aspect']}R{size['diameter']} ebadında yüksek performans lastiği",
                    is_active=True
                )
                created_products.append(product)
        
        # Aküler
        print("🔋 Aküler oluşturuluyor...")
        for brand in self.brands['battery']:
            for spec in self.battery_specs:
                name = f"{brand} {spec['ampere']}Ah {spec['voltage']}"
                sku = f"{brand.upper()[:3]}-{spec['ampere']}AH-{spec['voltage']}"
                product = Product.objects.create(
                    name=name,
                    slug=f"{brand.lower().replace(' ', '-')}-{spec['ampere']}ah-{spec['voltage'].lower()}",
                    sku=sku,
                    brand=brand,
                    category=categories['battery'],
                    battery_ampere=spec['ampere'],
                    battery_voltage=spec['voltage'],
                    description=f"{brand} marka {spec['ampere']}Ah kapasiteli {spec['voltage']} akü",
                    is_active=True
                )
                created_products.append(product)
        
        # Jantlar
        print("⚙️ Jantlar oluşturuluyor...")
        for brand in self.brands['rim']:
            for spec in self.rim_specs:
                name = f"{brand} {spec['size']} {spec['bolt']}"
                sku = f"{brand.upper()[:3]}-{spec['size'].replace('x', 'X')}-{spec['bolt'].replace('x', 'X')}"
                product = Product.objects.create(
                    name=name,
                    slug=f"{brand.lower().replace(' ', '-')}-{spec['size'].replace('x', 'x')}-{spec['bolt'].replace('x', 'x')}",
                    sku=sku,
                    brand=brand,
                    category=categories['rim'],
                    rim_size=spec['size'],
                    rim_bolt_pattern=spec['bolt'],
                    description=f"{brand} marka {spec['size']} ebadında {spec['bolt']} bijon desenli jant",
                    is_active=True
                )
                created_products.append(product)
        
        print(f"✅ Toplam {len(created_products)} ürün oluşturuldu")
        return created_products

    def create_stock_items(self, warehouses, products):
        """Stok kalemleri oluştur"""
        print("📊 Stok kalemleri oluşturuluyor...")
        
        created_stock_items = []
        
        for warehouse in warehouses:
            print(f"📦 {warehouse.company.name} - {warehouse.name} için stoklar oluşturuluyor...")
            
            # Her depo için rastgele ürün seçimi
            selected_products = random.sample(products, min(50, len(products)))
            
            for product in selected_products:
                # Gerçekçi fiyatlar
                base_cost = random.uniform(50, 500)
                if product.category.name == 'Lastik':
                    base_cost = random.uniform(200, 800)
                elif product.category.name == 'Akü':
                    base_cost = random.uniform(300, 1200)
                elif product.category.name == 'Jant':
                    base_cost = random.uniform(400, 1500)
                
                cost_price = Decimal(str(round(base_cost, 2)))
                sale_price = cost_price * Decimal(str(random.uniform(1.2, 1.8)))  # %20-80 kar marjı
                
                quantity = random.randint(5, 100)
                min_stock = random.randint(5, 20)
                
                stock_item = StockItem.objects.create(
                    product=product,
                    warehouse=warehouse,
                    quantity=quantity,
                    reserved_quantity=random.randint(0, min(5, quantity)),
                    minimum_stock=min_stock,
                    maximum_stock=random.choice([None, min_stock * 5]),
                    cost_price=cost_price,
                    sale_price=sale_price,
                    location_code=f"{random.choice(['A', 'B', 'C'])}{random.randint(1, 20)}",
                    barcode=f"{random.randint(1000000000000, 9999999999999)}",
                    is_active=True,
                    is_sellable=True,
                    last_inbound_date=timezone.now() - timedelta(days=random.randint(1, 30)),
                    last_count_date=timezone.now() - timedelta(days=random.randint(1, 7))
                )
                created_stock_items.append(stock_item)
        
        print(f"✅ Toplam {len(created_stock_items)} stok kalemi oluşturuldu")
        return created_stock_items

    def create_price_history(self, stock_items):
        """Fiyat geçmişi oluştur"""
        print("💰 Fiyat geçmişi oluşturuluyor...")
        
        price_history_records = []
        
        # Rastgele stok kalemlerinde fiyat değişikliği
        selected_items = random.sample(stock_items, min(50, len(stock_items)))
        
        for stock_item in selected_items:
            # Her stok kalemi için 1-3 fiyat değişikliği
            changes_count = random.randint(1, 3)
            
            current_cost = stock_item.cost_price
            current_sale = stock_item.sale_price
            
            for i in range(changes_count):
                # Eski fiyatlar
                old_cost = current_cost * Decimal(str(random.uniform(0.8, 1.2)))
                old_sale = current_sale * Decimal(str(random.uniform(0.8, 1.2)))
                
                change_type = random.choice(['increase', 'decrease', 'set'])
                change_reason = random.choice([
                    'Piyasa koşulları',
                    'Tedarikçi fiyat değişikliği', 
                    'Sezonsal ayarlama',
                    'Kampanya',
                    'Maliyet artışı',
                    'Rekabet gereği'
                ])
                
                price_history = PriceHistory.objects.create(
                    stock_item=stock_item,
                    old_cost_price=old_cost,
                    old_sale_price=old_sale,
                    new_cost_price=current_cost,
                    new_sale_price=current_sale,
                    change_type=change_type,
                    change_percentage=Decimal(str(random.uniform(5.0, 25.0))) if change_type != 'set' else None,
                    change_amount=Decimal(str(random.uniform(10.0, 100.0))) if change_type != 'set' else None,
                    changed_by='Sistem',
                    change_reason=change_reason,
                    created_at=timezone.now() - timedelta(days=random.randint(1, 30))
                )
                price_history_records.append(price_history)
        
        print(f"✅ Toplam {len(price_history_records)} fiyat geçmişi kaydı oluşturuldu")
        return price_history_records

    def create_retailer_wholesaler_relationships(self):
        """Bayi-toptancı ilişkilerini oluştur"""
        print("🤝 Bayi-toptancı ilişkileri oluşturuluyor...")
        
        retailers = Company.objects.filter(company_type='retailer')
        wholesalers = Company.objects.filter(company_type='wholesaler')
        
        relationships = []
        
        for retailer in retailers:
            # Her bayi için 1-2 toptancı ile ilişki
            selected_wholesalers = random.sample(list(wholesalers), min(2, len(wholesalers)))
            
            for wholesaler in selected_wholesalers:
                relationship = RetailerWholesaler.objects.create(
                    retailer=retailer,
                    wholesaler=wholesaler,
                    discount_rate=Decimal(str(random.uniform(5.0, 15.0))),
                    is_active=True
                )
                relationships.append(relationship)
                print(f"  ✅ {retailer.name} ↔ {wholesaler.name} (%{relationship.discount_rate} indirim)")
        
        print(f"✅ Toplam {len(relationships)} ilişki oluşturuldu")
        return relationships

    def run(self):
        """Ana işlem"""
        print("🚀 Kapsamlı test verileri oluşturma başlıyor...")
        print("=" * 50)
        
        try:
            # Mevcut test verilerini temizle
            self.clear_existing_test_data()
            
            # Ek şirketler oluştur
            new_companies = self.create_additional_companies()
            
            # Ek kullanıcılar oluştur
            new_users = self.create_additional_users(new_companies)
            
            # Depolar oluştur
            warehouses = self.create_warehouses()
            
            # Ürünler oluştur
            products = self.create_products()
            
            # Stok kalemleri oluştur
            stock_items = self.create_stock_items(warehouses, products)
            
            # Fiyat geçmişi oluştur
            price_history = self.create_price_history(stock_items)
            
            # Bayi-toptancı ilişkileri oluştur
            relationships = self.create_retailer_wholesaler_relationships()
            
            print("=" * 50)
            print("✅ Kapsamlı test verileri başarıyla oluşturuldu!")
            print(f"📊 ÖZET:")
            print(f"   - Şirketler: {Company.objects.count()}")
            print(f"   - Kullanıcılar: {User.objects.count()}")
            print(f"   - Depolar: {len(warehouses)}")
            print(f"   - Ürünler: {len(products)}")
            print(f"   - Stok kalemleri: {len(stock_items)}")
            print(f"   - Fiyat geçmişi kayıtları: {len(price_history)}")
            print(f"   - Bayi-toptancı ilişkileri: {len(relationships)}")
            
            print("\n🔑 GİRİŞ BİLGİLERİ (Mevcut kullanıcılar korundu):")
            print("Admin: admin@tyrex.com / admin123")
            print("Pro: pro@guvenotolastik.com / pro123")
            print("Ultra: ultra@megalastikmerkezi.com / ultra123")
            print("\n🆕 YENİ KULLANICILAR:")
            for user in new_users:
                print(f"   {user.email} / {user.email.split('@')[0]}123")
            
        except Exception as e:
            print(f"❌ Hata oluştu: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
        
        return True

if __name__ == "__main__":
    generator = ComprehensiveTestDataGenerator()
    success = generator.run()
    sys.exit(0 if success else 1)