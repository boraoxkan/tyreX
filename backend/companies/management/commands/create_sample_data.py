from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from companies.models import Company, RetailerWholesaler
from products.models import Category, Attribute, Product, ProductAttributeValue
from inventory.models import Warehouse, StockItem
from decimal import Decimal
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Çoklu toptancı ilişkileri ile gelişmiş örnek veri oluşturur'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Mevcut verileri temizle ve yeniden oluştur',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('🗑️ Mevcut veriler temizleniyor...'))
            self.clear_existing_data()

        try:
            with transaction.atomic():
                self.create_sample_data()
                self.stdout.write(self.style.SUCCESS('✅ Gelişmiş örnek veriler başarıyla oluşturuldu!'))
                self.print_summary()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Hata oluştu: {str(e)}'))
            raise

    def clear_existing_data(self):
        """Mevcut verileri temizle"""
        StockItem.objects.all().delete()
        Warehouse.objects.all().delete()
        ProductAttributeValue.objects.all().delete()
        Product.objects.all().delete()
        Attribute.objects.all().delete()
        Category.objects.all().delete()
        RetailerWholesaler.objects.all().delete()
        User.objects.filter(company__isnull=False).delete()
        Company.objects.all().delete()

    def create_sample_data(self):
        """Örnek verileri oluştur"""
        
        # 1. TOPTANCILAR
        self.stdout.write('🏭 Toptancılar oluşturuluyor...')
        wholesalers = self.create_wholesalers()
        
        # 2. PERAKENDECİLER ve KULLANICILAR
        self.stdout.write('🏪 Perakendeciler oluşturuluyor...')
        retailers = self.create_retailers_and_users(wholesalers)
        
        # 3. KATEGORİLER
        self.stdout.write('📂 Kategoriler oluşturuluyor...')
        categories = self.create_categories()
        
        # 4. ÖZELLİKLER
        self.stdout.write('🏷️ Özellikler oluşturuluyor...')
        attributes = self.create_attributes(categories)
        
        # 5. ÜRÜNLER
        self.stdout.write('🛞 Ürünler oluşturuluyor...')
        products = self.create_products(categories, attributes)
        
        # 6. DEPOLAR
        self.stdout.write('🏢 Depolar oluşturuluyor...')
        warehouses = self.create_warehouses(wholesalers + [r['company'] for r in retailers])
        
        # 7. STOK KALEMLERİ
        self.stdout.write('📦 Stok kalemleri oluşturuluyor...')
        self.create_stock_items(products, warehouses, len(wholesalers))

    def create_wholesalers(self):
        """5 farklı toptancı oluştur"""
        wholesaler_data = [
            {
                'name': 'Mega Lastik Toptancısı A.Ş.',
                'email': 'info@megalastik.com.tr',
                'phone': '+90 312 444 55 66',
                'address': 'Ostim OSB, Ankara'
            },
            {
                'name': 'Anadolu Lastik Dağıtım Ltd.',
                'email': 'satis@anadolulastik.com',
                'phone': '+90 232 333 44 55',
                'address': 'Atatürk OSB, İzmir'
            },
            {
                'name': 'Karadeniz Oto Aksesuar San. Tic.',
                'email': 'bilgi@karadenizoto.com',
                'phone': '+90 462 222 33 44',
                'address': 'Sanayi Sitesi, Trabzon'
            },
            {
                'name': 'İstanbul Premium Lastik Merkezi',
                'email': 'contact@premiumlastik.com.tr',
                'phone': '+90 212 555 77 88',
                'address': 'Ikitelli OSB, İstanbul'
            },
            {
                'name': 'Güney Anadolu Ticaret A.Ş.',
                'email': 'info@guneyticaret.com',
                'phone': '+90 324 666 77 88',
                'address': 'Organize Sanayi, Mersin'
            }
        ]
        
        wholesalers = []
        for i, data in enumerate(wholesaler_data):
            wholesaler = Company.objects.create(
                name=data['name'],
                company_type='wholesaler',
                is_managed_by_tyrex=i < 3,  # İlk 3'ü Tyrex platformunda
                email=data['email'],
                phone=data['phone'],
                address=data['address'],
                is_active=True
            )
            wholesalers.append(wholesaler)
            
        return wholesalers

    def create_retailers_and_users(self, wholesalers):
        """5 perakendeci ve kullanıcı oluştur, çoklu toptancı ilişkileri kur"""
        retailer_scenarios = [
            {
                'company_name': 'Premium Lastik Mağazası',
                'user_email': 'ahmet@premiumlastik.com',
                'user_name': 'Ahmet Yılmaz',
                'password': 'premium123',
                'phone': '+90 212 444 55 66',
                'address': 'Nişantaşı, İstanbul',
                'wholesaler_relations': [
                    {'idx': 0, 'credit': 200000, 'days': 60, 'notes': 'VIP müşteri - premium segment'},
                    {'idx': 3, 'credit': 150000, 'days': 45, 'notes': 'Lüks araç lastikleri için'}
                ]
            },
            {
                'company_name': 'Hızlı Lastik Zinciri',
                'user_email': 'mehmet@hizlilastik.com',
                'user_name': 'Mehmet Özkan',
                'password': 'hizli123',
                'phone': '+90 232 333 44 55',
                'address': 'Konak, İzmir',
                'wholesaler_relations': [
                    {'idx': 1, 'credit': 300000, 'days': 30, 'notes': 'Ana tedarikçi - büyük hacim'},
                    {'idx': 0, 'credit': 100000, 'days': 45, 'notes': 'Yedek tedarikçi'},
                    {'idx': 2, 'credit': 75000, 'days': 15, 'notes': 'Bölgesel ürünler için'}
                ]
            },
            {
                'company_name': 'Aile İşletmesi Lastikçi',
                'user_email': 'fatma@ailelastik.com',
                'user_name': 'Fatma Demir',
                'password': 'aile123',
                'phone': '+90 312 222 33 44',
                'address': 'Kızılay, Ankara',
                'wholesaler_relations': [
                    {'idx': 0, 'credit': 50000, 'days': 30, 'notes': 'Uzun soluklu işbirliği'}
                ]
            },
            {
                'company_name': 'Mega Lastik Market',
                'user_email': 'ali@megalastikmarket.com',
                'user_name': 'Ali Kaya',
                'password': 'mega123',
                'phone': '+90 224 555 66 77',
                'address': 'Osmangazi, Bursa',
                'wholesaler_relations': [
                    {'idx': 0, 'credit': 400000, 'days': 90, 'notes': 'Büyük zincir - en yüksek kredi'},
                    {'idx': 1, 'credit': 250000, 'days': 60, 'notes': 'İkinci tedarikçi'},
                    {'idx': 4, 'credit': 100000, 'days': 30, 'notes': 'Ağır vasıta segmenti'}
                ]
            },
            {
                'company_name': 'Üniversite Lastik Servisi',
                'user_email': 'zeynep@unilastik.com',
                'user_name': 'Zeynep Arslan',
                'password': 'uni123',
                'phone': '+90 342 444 55 66',
                'address': 'Merkez, Gaziantep',
                'wholesaler_relations': [
                    {'idx': 1, 'credit': 80000, 'days': 45, 'notes': 'Öğrenci dostu fiyatlar'},
                    {'idx': 2, 'credit': 60000, 'days': 30, 'notes': 'Yerel tedarik'}
                ]
            }
        ]
        
        retailers = []
        for scenario in retailer_scenarios:
            # Company oluştur
            company = Company.objects.create(
                name=scenario['company_name'],
                company_type='retailer',
                is_managed_by_tyrex=True,
                email=scenario['user_email'],
                phone=scenario['phone'],
                address=scenario['address'],
                is_active=True
            )
            
            # User oluştur
            first_name, last_name = scenario['user_name'].split(' ', 1)
            user = User.objects.create_user(
                email=scenario['user_email'],
                password=scenario['password'],
                first_name=first_name,
                last_name=last_name,
                company=company,
                is_active=True
            )
            
            # Toptancı ilişkileri oluştur
            for relation in scenario['wholesaler_relations']:
                RetailerWholesaler.objects.create(
                    retailer=company,
                    wholesaler=wholesalers[relation['idx']],
                    is_active=True,
                    credit_limit=Decimal(str(relation['credit'])),
                    payment_terms_days=relation['days'],
                    notes=relation['notes']
                )
            
            retailers.append({'company': company, 'user': user})
            
        return retailers

    def create_categories(self):
        """Kategori hiyerarşisi oluştur"""
        # Ana kategoriler
        main_categories = {
            'otomobil': Category.objects.create(
                name='Otomobil Lastikleri', slug='otomobil-lastikleri',
                description='Binek araç lastikleri', sort_order=1
            ),
            'kamyon': Category.objects.create(
                name='Kamyon Lastikleri', slug='kamyon-lastikleri', 
                description='Ağır vasıta lastikleri', sort_order=2
            )
        }
        
        # Alt kategoriler
        sub_categories = {}
        sub_data = [
            {'name': 'Yaz Lastikleri', 'slug': 'yaz-lastikleri', 'parent': 'otomobil'},
            {'name': 'Kış Lastikleri', 'slug': 'kis-lastikleri', 'parent': 'otomobil'},
            {'name': '4 Mevsim Lastikleri', 'slug': '4-mevsim-lastikleri', 'parent': 'otomobil'},
            {'name': 'Kamyon Ön Lastik', 'slug': 'kamyon-on-lastik', 'parent': 'kamyon'}
        ]
        
        for sub in sub_data:
            sub_categories[sub['slug']] = Category.objects.create(
                name=sub['name'], slug=sub['slug'],
                parent=main_categories[sub['parent']], sort_order=1
            )
        
        return {**main_categories, **sub_categories}

    def create_attributes(self, categories):
        """Ürün özelliklerini oluştur"""
        attributes = {}
        
        # Ebat
        attributes['ebat'] = Attribute.objects.create(
            name='Ebat', attribute_type='text', is_required=True, sort_order=1
        )
        attributes['ebat'].categories.add(categories['otomobil'], categories['kamyon'])
        
        # Marka
        attributes['marka'] = Attribute.objects.create(
            name='Marka', attribute_type='choice', is_required=True, sort_order=2,
            choices='Pirelli\nMichelin\nBridgestone\nGoodyear\nContinental\nYokohama'
        )
        attributes['marka'].categories.add(categories['otomobil'], categories['kamyon'])
        
        # Hız indeksi
        attributes['hiz'] = Attribute.objects.create(
            name='Hız İndeksi', attribute_type='choice', sort_order=3,
            choices='H (210 km/h)\nV (240 km/h)\nW (270 km/h)\nY (300 km/h)'
        )
        attributes['hiz'].categories.add(categories['otomobil'])
        
        # Yük indeksi
        attributes['yuk'] = Attribute.objects.create(
            name='Yük İndeksi', attribute_type='number', unit='kg',
            is_required=True, sort_order=4
        )
        attributes['yuk'].categories.add(categories['otomobil'], categories['kamyon'])
        
        # Mevsim
        attributes['mevsim'] = Attribute.objects.create(
            name='Mevsim', attribute_type='choice', is_required=True, sort_order=5,
            choices='Yaz\nKış\n4 Mevsim'
        )
        attributes['mevsim'].categories.add(categories['otomobil'])
        
        return attributes

    def create_products(self, categories, attributes):
        """Çeşitli ürünler oluştur"""
        product_data = [
            {
                'name': 'Pirelli P Zero', 'category': 'yaz-lastikleri', 'sku': 'PIR-PZERO-225-45-17',
                'brand': 'Pirelli', 'attrs': {'ebat': '225/45 R17', 'marka': 'Pirelli',
                'hiz': 'Y (300 km/h)', 'yuk': 875, 'mevsim': 'Yaz'}
            },
            {
                'name': 'Michelin Pilot Sport 4', 'category': 'yaz-lastikleri', 'sku': 'MIC-PS4-225-45-17',
                'brand': 'Michelin', 'attrs': {'ebat': '225/45 R17', 'marka': 'Michelin',
                'hiz': 'W (270 km/h)', 'yuk': 875, 'mevsim': 'Yaz'}
            },
            {
                'name': 'Continental WinterContact', 'category': 'kis-lastikleri', 'sku': 'CON-WC-195-65-15',
                'brand': 'Continental', 'attrs': {'ebat': '195/65 R15', 'marka': 'Continental',
                'hiz': 'T (190 km/h)', 'yuk': 750, 'mevsim': 'Kış'}
            },
            {
                'name': 'Goodyear Vector 4Seasons', 'category': '4-mevsim-lastikleri', 'sku': 'GOO-VEC-215-60-16',
                'brand': 'Goodyear', 'attrs': {'ebat': '215/60 R16', 'marka': 'Goodyear',
                'hiz': 'V (240 km/h)', 'yuk': 850, 'mevsim': '4 Mevsim'}
            },
            {
                'name': 'Bridgestone Duravis', 'category': 'kamyon-on-lastik', 'sku': 'BRI-DUR-315-80-22',
                'brand': 'Bridgestone', 'attrs': {'ebat': '315/80 R22.5', 'marka': 'Bridgestone', 'yuk': 3500}
            }
        ]
        
        products = []
        for data in product_data:
            product = Product.objects.create(
                name=data['name'],
                slug=data['name'].lower().replace(' ', '-'),
                category=categories[data['category']],
                sku=data['sku'],
                brand=data['brand'],
                weight=Decimal('10.5'),
                is_active=True
            )
            
            # Ürün özelliklerini ekle
            for attr_key, attr_value in data['attrs'].items():
                if attr_key in attributes:
                    ProductAttributeValue.objects.create(
                        product=product,
                        attribute=attributes[attr_key],
                        value_text=str(attr_value) if attr_key != 'yuk' else None,
                        value_number=Decimal(str(attr_value)) if attr_key == 'yuk' else None
                    )
            
            products.append(product)
            
        return products

    def create_warehouses(self, companies):
        """Her şirket için depo oluştur"""
        warehouses = []
        for i, company in enumerate(companies):
            warehouse_type = 'main' if company.company_type == 'wholesaler' else 'retail'
            capacity = random.randint(15000, 50000) if warehouse_type == 'main' else random.randint(500, 2000)
            
            warehouse = Warehouse.objects.create(
                name=f'{company.name} Deposu',
                code=f'WH{i+1:03d}',
                company=company,
                address=company.address,
                city=company.address.split(',')[-1].strip(),
                phone=company.phone,
                total_area=Decimal('2500.00'),
                storage_capacity=capacity,
                warehouse_type=warehouse_type,
                is_active=True
            )
            warehouses.append(warehouse)
            
        return warehouses

    def create_stock_items(self, products, warehouses, wholesaler_count):
        """Stok kalemleri oluştur"""
        # Toptancı depolarında stok
        for warehouse in warehouses[:wholesaler_count]:
            for product in products:
                if random.choice([True, False, True]):  # %66 şans
                    quantity = random.randint(20, 200)
                    cost_price = Decimal(str(random.uniform(300, 700)))
                    sale_price = cost_price * Decimal('1.4')
                    
                    StockItem.objects.create(
                        product=product, warehouse=warehouse, quantity=quantity,
                        reserved_quantity=random.randint(0, 5), minimum_stock=10,
                        maximum_stock=quantity + 100, cost_price=cost_price,
                        sale_price=sale_price, location_code=f'A{random.randint(1, 10)}-B{random.randint(1, 20)}',
                        is_active=True, is_sellable=True
                    )
        
        # Perakendeci depolarında daha az stok
        for warehouse in warehouses[wholesaler_count:]:
            selected_products = random.sample(products, min(3, len(products)))
            for product in selected_products:
                quantity = random.randint(2, 15)
                cost_price = Decimal(str(random.uniform(500, 1000)))
                sale_price = cost_price * Decimal('1.3')
                
                StockItem.objects.create(
                    product=product, warehouse=warehouse, quantity=quantity,
                    reserved_quantity=0, minimum_stock=2, maximum_stock=quantity + 20,
                    cost_price=cost_price, sale_price=sale_price,
                    location_code=f'M{random.randint(1, 5)}', is_active=True, is_sellable=True
                )

    def print_summary(self):
        """Özet rapor yazdır"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('📊 ÖRNEK VERİLER ÖZETİ'))
        self.stdout.write('='*50)
        
        # Temel istatistikler
        self.stdout.write(f'🏢 Toplam Şirket: {Company.objects.count()}')
        self.stdout.write(f'   📦 Toptancılar: {Company.objects.filter(company_type="wholesaler").count()}')
        self.stdout.write(f'   🏪 Perakendeciler: {Company.objects.filter(company_type="retailer").count()}')
        self.stdout.write(f'🔗 Toptancı İlişkileri: {RetailerWholesaler.objects.count()}')
        self.stdout.write(f'👥 Kullanıcılar: {User.objects.filter(company__isnull=False).count()}')
        self.stdout.write(f'🛞 Ürünler: {Product.objects.count()}')
        self.stdout.write(f'🏢 Depolar: {Warehouse.objects.count()}')
        self.stdout.write(f'📦 Stok Kalemleri: {StockItem.objects.count()}')
        
        # Test kullanıcıları
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('👥 TEST KULLANICILARI'))
        self.stdout.write('='*50)
        
        test_users = [
            ('ahmet@premiumlastik.com', 'premium123', '2 toptancı'),
            ('mehmet@hizlilastik.com', 'hizli123', '3 toptancı'),
            ('fatma@ailelastik.com', 'aile123', '1 toptancı'),
            ('ali@megalastikmarket.com', 'mega123', '3 toptancı'),
            ('zeynep@unilastik.com', 'uni123', '2 toptancı')
        ]
        
        for email, password, relations in test_users:
            self.stdout.write(f'📧 {email} / 🔑 {password} ({relations})')
        
        # API endpoint'leri
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('🔗 TEST EDİLECEK API\'LAR'))
        self.stdout.write('='*50)
        self.stdout.write('GET  /api/v1/companies/wholesalers/')
        self.stdout.write('POST /api/v1/auth/register/')
        self.stdout.write('POST /api/v1/auth/token/')
        self.stdout.write('GET  /api/v1/users/me/')
        self.stdout.write('GET  /api/v1/users/wholesaler-relations/')
        self.stdout.write('POST /api/v1/users/wholesaler-relations/add/')
        self.stdout.write('GET  /api/v1/users/wholesaler-summary/')
        
        self.stdout.write(f'\n🎉 Çoklu toptancı sistemi test edilmeye hazır!')
        self.stdout.write(f'🔗 http://localhost:8000/admin/')
        self.stdout.write(f'🔗 http://localhost:8000/api/v1/health/')