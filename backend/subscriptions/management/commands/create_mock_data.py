from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
import random
from datetime import datetime, timedelta

from products.models import Category, Attribute, Product, ProductAttributeValue
from companies.models import Company
from customers.models import Customer, StoredTire, CustomerVisit
from inventory.models import Warehouse, StockItem


class Command(BaseCommand):
    help = 'Mock data oluşturur (kategoriler, ürünler, müşteriler, stok vb.)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("📦 Mock data oluşturuluyor..."))
        
        with transaction.atomic():
            self.create_categories()
            self.create_attributes() 
            self.create_products()
            self.create_customers()
            self.create_warehouses()
            self.create_stock_items()
            
        self.stdout.write(self.style.SUCCESS("✅ Mock data başarıyla oluşturuldu!"))

    def create_categories(self):
        """Lastik kategorilerini oluştur"""
        self.stdout.write("📁 Kategoriler oluşturuluyor...")
        
        categories_data = [
            {
                'name': 'Binek Araç Lastikleri',
                'description': 'Otomobil ve hafif ticari araçlar için lastikler',
                'parent': None
            },
            {
                'name': 'Yaz Lastikleri',
                'description': 'Yaz koşulları için optimize edilmiş lastikler',
                'parent': 'Binek Araç Lastikleri'
            },
            {
                'name': 'Kış Lastikleri', 
                'description': 'Kar ve buzlu yollarda güvenli sürüş',
                'parent': 'Binek Araç Lastikleri'
            },
            {
                'name': '4 Mevsim Lastikleri',
                'description': 'Tüm mevsim koşullarına uygun lastikler',
                'parent': 'Binek Araç Lastikleri'
            },
            {
                'name': 'Kamyon Lastikleri',
                'description': 'Ağır vasıta ve kamyon lastikleri',
                'parent': None
            },
            {
                'name': 'Motosiklet Lastikleri',
                'description': 'Motosiklet ve scooter lastikleri',
                'parent': None
            }
        ]
        
        created_categories = {}
        for cat_data in categories_data:
            parent_obj = None
            if cat_data['parent']:
                parent_obj = created_categories.get(cat_data['parent'])
            
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'parent': parent_obj,
                    'is_active': True
                }
            )
            created_categories[cat_data['name']] = category
            if created:
                self.stdout.write(f"  ✅ {category.name}")

    def create_attributes(self):
        """Lastik özelliklerini oluştur"""
        self.stdout.write("🏷️ Özellikler oluşturuluyor...")
        
        attributes_data = [
            {'name': 'Genişlik', 'attribute_type': 'number', 'unit': 'mm'},
            {'name': 'Profil', 'attribute_type': 'number', 'unit': '%'},
            {'name': 'Çap', 'attribute_type': 'number', 'unit': 'inch'},
            {'name': 'Hız İndeksi', 'attribute_type': 'text', 'unit': ''},
            {'name': 'Yük İndeksi', 'attribute_type': 'number', 'unit': ''},
            {'name': 'Marka', 'attribute_type': 'text', 'unit': ''},
            {'name': 'Model', 'attribute_type': 'text', 'unit': ''},
            {'name': 'DOT Kodu', 'attribute_type': 'text', 'unit': ''},
            {'name': 'Üretim Tarihi', 'attribute_type': 'text', 'unit': ''},
            {'name': 'Fuel Efficiency', 'attribute_type': 'text', 'unit': ''},
            {'name': 'Wet Grip', 'attribute_type': 'text', 'unit': ''},
            {'name': 'Noise Level', 'attribute_type': 'number', 'unit': 'dB'}
        ]
        
        for attr_data in attributes_data:
            attribute, created = Attribute.objects.get_or_create(
                name=attr_data['name'],
                defaults={
                    'attribute_type': attr_data['attribute_type'],
                    'unit': attr_data['unit'],
                    'is_required': attr_data['name'] in ['Genişlik', 'Profil', 'Çap', 'Marka']
                }
            )
            if created:
                self.stdout.write(f"  ✅ {attribute.name}")

    def create_products(self):
        """Lastik ürünlerini oluştur"""
        self.stdout.write("🚗 Ürünler oluşturuluyor...")
        
        # Ana kategorileri al
        binek_category = Category.objects.get(name='Binek Araç Lastikleri')
        yaz_category = Category.objects.get(name='Yaz Lastikleri')
        kis_category = Category.objects.get(name='Kış Lastikleri')
        
        # Özellikler
        genislik_attr = Attribute.objects.get(name='Genişlik')
        profil_attr = Attribute.objects.get(name='Profil')
        cap_attr = Attribute.objects.get(name='Çap')
        marka_attr = Attribute.objects.get(name='Marka')
        model_attr = Attribute.objects.get(name='Model')
        hiz_attr = Attribute.objects.get(name='Hız İndeksi')
        yuk_attr = Attribute.objects.get(name='Yük İndeksi')
        
        # Lastik boyutları ve markalar
        tire_sizes = [
            (195, 65, 15), (205, 55, 16), (215, 60, 16), (225, 45, 17),
            (235, 40, 18), (245, 35, 19), (255, 30, 20), (185, 60, 15),
            (175, 70, 14), (165, 80, 13)
        ]
        
        brands = ['Michelin', 'Bridgestone', 'Continental', 'Goodyear', 'Pirelli', 'Dunlop', 'Yokohama', 'Hankook', 'Toyo', 'Kumho']
        speed_indexes = ['H', 'V', 'W', 'Y', 'Z']
        
        products_created = 0
        for brand in brands[:6]:  # İlk 6 marka
            for i, (width, profile, diameter) in enumerate(tire_sizes[:8]):  # İlk 8 boyut
                # Yaz lastiği
                yaz_product_name = f"{brand} {width}/{profile}R{diameter} Yaz Lastiği"
                yaz_product, created = Product.objects.get_or_create(
                    name=yaz_product_name,
                    defaults={
                        'description': f"{brand} markalı {width}/{profile}R{diameter} boyutunda yaz lastiği. Mükemmel yol tutuşu ve uzun ömür.",
                        'main_category': yaz_category,
                        'price': Decimal(str(random.randint(800, 2500))),
                        'is_active': True,
                        'weight': Decimal(str(random.randint(8, 15))),
                        'dimensions': f"{width}x{profile}x{diameter}"
                    }
                )
                
                if created:
                    # Ana kategoriyi ekle
                    yaz_product.additional_categories.add(binek_category)
                    
                    # Özellikleri ekle
                    ProductAttributeValue.objects.create(product=yaz_product, attribute=genislik_attr, value=str(width))
                    ProductAttributeValue.objects.create(product=yaz_product, attribute=profil_attr, value=str(profile))
                    ProductAttributeValue.objects.create(product=yaz_product, attribute=cap_attr, value=str(diameter))
                    ProductAttributeValue.objects.create(product=yaz_product, attribute=marka_attr, value=brand)
                    ProductAttributeValue.objects.create(product=yaz_product, attribute=model_attr, value=f"Summer Pro {i+1}")
                    ProductAttributeValue.objects.create(product=yaz_product, attribute=hiz_attr, value=random.choice(speed_indexes))
                    ProductAttributeValue.objects.create(product=yaz_product, attribute=yuk_attr, value=str(random.randint(82, 94)))
                    
                    products_created += 1
                
                # Kış lastiği
                if i < 5:  # Sadece 5 kış lastiği
                    kis_product_name = f"{brand} {width}/{profile}R{diameter} Kış Lastiği"
                    kis_product, created = Product.objects.get_or_create(
                        name=kis_product_name,
                        defaults={
                            'description': f"{brand} markalı {width}/{profile}R{diameter} boyutunda kış lastiği. Kar ve buzda üstün performans.",
                            'main_category': kis_category,
                            'price': Decimal(str(random.randint(900, 2800))),
                            'is_active': True,
                            'weight': Decimal(str(random.randint(8, 15))),
                            'dimensions': f"{width}x{profile}x{diameter}"
                        }
                    )
                    
                    if created:
                        kis_product.additional_categories.add(binek_category)
                        
                        ProductAttributeValue.objects.create(product=kis_product, attribute=genislik_attr, value=str(width))
                        ProductAttributeValue.objects.create(product=kis_product, attribute=profil_attr, value=str(profile))
                        ProductAttributeValue.objects.create(product=kis_product, attribute=cap_attr, value=str(diameter))
                        ProductAttributeValue.objects.create(product=kis_product, attribute=marka_attr, value=brand)
                        ProductAttributeValue.objects.create(product=kis_product, attribute=model_attr, value=f"Winter Max {i+1}")
                        ProductAttributeValue.objects.create(product=kis_product, attribute=hiz_attr, value=random.choice(speed_indexes))
                        ProductAttributeValue.objects.create(product=kis_product, attribute=yuk_attr, value=str(random.randint(82, 94)))
                        
                        products_created += 1
        
        self.stdout.write(f"  ✅ {products_created} ürün oluşturuldu")

    def create_customers(self):
        """Demo müşteriler oluştur"""
        self.stdout.write("👥 Müşteriler oluşturuluyor...")
        
        # Toptancı şirket (PRO pakete sahip)
        wholesaler_company = Company.objects.get(name='Hızlı Lastik Ltd')
        
        customers_data = [
            {
                'first_name': 'Ayşe', 'last_name': 'Demir', 'phone': '+90 532 123 4567',
                'email': 'ayse.demir@gmail.com', 'address': 'Çankaya, Ankara',
                'vehicle_info': '2018 Volkswagen Golf - 34 ABC 123'
            },
            {
                'first_name': 'Mehmet', 'last_name': 'Kaya', 'phone': '+90 533 234 5678', 
                'email': 'mehmet.kaya@hotmail.com', 'address': 'Keçiören, Ankara',
                'vehicle_info': '2020 Toyota Corolla - 06 DEF 456'
            },
            {
                'first_name': 'Fatma', 'last_name': 'Özkan', 'phone': '+90 534 345 6789',
                'email': 'fatma.ozkan@yahoo.com', 'address': 'Mamak, Ankara', 
                'vehicle_info': '2017 Renault Clio - 06 GHI 789'
            },
            {
                'first_name': 'Ali', 'last_name': 'Yılmaz', 'phone': '+90 535 456 7890',
                'email': 'ali.yilmaz@gmail.com', 'address': 'Yenimahalle, Ankara',
                'vehicle_info': '2019 Ford Focus - 06 JKL 012'
            },
            {
                'first_name': 'Zeynep', 'last_name': 'Çelik', 'phone': '+90 536 567 8901',
                'email': 'zeynep.celik@hotmail.com', 'address': 'Etimesgut, Ankara',
                'vehicle_info': '2021 Hyundai i20 - 06 MNO 345'
            }
        ]
        
        for customer_data in customers_data:
            customer, created = Customer.objects.get_or_create(
                email=customer_data['email'],
                defaults={
                    'company': wholesaler_company,
                    'first_name': customer_data['first_name'],
                    'last_name': customer_data['last_name'],
                    'phone': customer_data['phone'],
                    'address': customer_data['address'],
                    'vehicle_info': customer_data['vehicle_info'],
                    'is_active': True
                }
            )
            
            if created:
                self.stdout.write(f"  ✅ {customer.get_full_name()}")
                
                # Müşteri ziyaretleri oluştur
                for i in range(random.randint(1, 4)):
                    visit_date = datetime.now() - timedelta(days=random.randint(1, 180))
                    CustomerVisit.objects.create(
                        customer=customer,
                        visit_date=visit_date,
                        notes=f"Müşteri {random.choice(['lastik kontrolü', 'balans ayarı', 'lastik değişimi', 'genel kontrol'])} için geldi."
                    )
                
                # Saklanan lastikler oluştur
                if random.choice([True, False, False]):  # %33 ihtimalle
                    stored_tires_count = random.randint(1, 2)
                    for j in range(stored_tires_count):
                        brand = random.choice(['Michelin', 'Bridgestone', 'Continental'])
                        size = random.choice(['195/65R15', '205/55R16', '215/60R16'])
                        StoredTire.objects.create(
                            customer=customer,
                            brand=brand,
                            size=size,
                            quantity=4,
                            storage_date=datetime.now() - timedelta(days=random.randint(30, 365)),
                            notes=f"{brand} {size} takım lastik - {random.choice(['Yaz', 'Kış'])} lastiği"
                        )

    def create_warehouses(self):
        """Demo depolar oluştur"""
        self.stdout.write("🏪 Depolar oluşturuluyor...")
        
        ultra_company = Company.objects.get(name='Premium Lastik AŞ')
        pro_company = Company.objects.get(name='Hızlı Lastik Ltd')
        
        warehouses_data = [
            {
                'company': ultra_company,
                'name': 'Ana Depo İstanbul',
                'address': 'İstanbul Ticaret Merkezi, Beyoğlu/İstanbul',
                'capacity': 5000
            },
            {
                'company': ultra_company, 
                'name': 'Şube Depo Kadıköy',
                'address': 'Kadıköy Lastik Merkezi, Kadıköy/İstanbul',
                'capacity': 2000
            },
            {
                'company': pro_company,
                'name': 'Merkez Depo Ankara',
                'address': 'Ankara Sanayi Sitesi, Çankaya/Ankara', 
                'capacity': 1500
            }
        ]
        
        for warehouse_data in warehouses_data:
            warehouse, created = Warehouse.objects.get_or_create(
                name=warehouse_data['name'],
                company=warehouse_data['company'],
                defaults={
                    'address': warehouse_data['address'],
                    'capacity': warehouse_data['capacity'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f"  ✅ {warehouse.name}")

    def create_stock_items(self):
        """Stok kalemleri oluştur"""
        self.stdout.write("📦 Stok kalemleri oluşturuluyor...")
        
        warehouses = Warehouse.objects.all()
        products = Product.objects.all()[:20]  # İlk 20 ürün
        
        items_created = 0
        for warehouse in warehouses:
            # Her depoda rastgele ürünler stokla
            warehouse_products = random.sample(list(products), min(12, len(products)))
            
            for product in warehouse_products:
                stock_item, created = StockItem.objects.get_or_create(
                    warehouse=warehouse,
                    product=product,
                    defaults={
                        'quantity': random.randint(20, 200),
                        'reserved_quantity': random.randint(0, 10),
                        'reorder_level': random.randint(10, 50),
                        'location': f"Raf-{random.randint(1, 20)}-{chr(65 + random.randint(0, 7))}"
                    }
                )
                if created:
                    items_created += 1
        
        self.stdout.write(f"  ✅ {items_created} stok kalemi oluşturuldu")