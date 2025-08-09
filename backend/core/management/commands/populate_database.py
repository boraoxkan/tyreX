import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

from companies.models import Company, RetailerWholesaler
from customers.models import Customer, StoredTire, CustomerVisit
from inventory.models import Warehouse, StockItem
from products.models import Category, Product
from orders.models import Order, OrderItem
from subscriptions.models import SubscriptionPlan, Subscription
from users.models import User

fake = Faker('tr_TR')

class Command(BaseCommand):
    help = 'Populates the database with a rich set of mock data for testing.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database population...'))

        # 1. Clean the database
        self.stdout.write('Cleaning database...')
        self._clean_database()

        # 2. Create Subscription Plans
        self.stdout.write('Creating subscription plans...')
        self._create_subscription_plans()

        # 3. Create Categories
        self.stdout.write('Creating categories...')
        self._create_categories()

        # 4. Create Companies and Users
        self.stdout.write('Creating companies and users...')
        self._create_companies_and_users()

        # 5. Create Products
        self.stdout.write('Creating products...')
        self._create_products()

        # 6. Create Warehouses and Stock
        self.stdout.write('Creating warehouses and stock items...')
        self._create_warehouses_and_stock()

        # 7. Create Customers and Related Data
        self.stdout.write('Creating customers, stored tires, and visits...')
        self._create_customers_and_related_data()

        # 8. Create Orders
        self.stdout.write('Creating orders...')
        self._create_orders()

        self.stdout.write(self.style.SUCCESS('Database population complete!'))

    def _clean_database(self):
        """Deletes all data from the relevant models."""
        models_to_clean = [
            Order, Customer, StoredTire, CustomerVisit, StockItem, Product, 
            Warehouse, RetailerWholesaler, User, Company, Subscription, 
            SubscriptionPlan, Category
        ]
        for model in models_to_clean:
            model.objects.all().delete()

    def _create_subscription_plans(self):
        """Creates PRO and ULTRA subscription plans."""
        SubscriptionPlan.objects.create(
            name='PRO',
            plan_type='pro',
            monthly_price=300,
            yearly_price=3000,
            description='Müşteri yönetimi ve temel B2B özellikleri.',
            max_users=3,
            max_warehouses=2,
            max_products=500,
            customer_management_access=True,
            full_dashboard_access=False,
            marketplace_access=False,
        )
        SubscriptionPlan.objects.create(
            name='ULTRA',
            plan_type='ultra',
            monthly_price=4500,
            yearly_price=45000,
            description='Tüm özelliklere sınırsız erişim.',
            max_users=100,
            max_warehouses=100,
            max_products=10000,
            customer_management_access=True,
            full_dashboard_access=True,
            marketplace_access=True,
        )

    def _create_categories(self):
        """Creates hierarchical categories."""
        # Ana kategoriler
        otomotiv = Category.objects.create(name='Otomotiv', slug='otomotiv')
        
        # Lastik kategorileri
        lastik = Category.objects.create(name='Lastik', slug='lastik', parent=otomotiv)
        Category.objects.create(name='Yaz Lastikleri', slug='yaz-lastikleri', parent=lastik)
        Category.objects.create(name='Kış Lastikleri', slug='kis-lastikleri', parent=lastik)
        Category.objects.create(name='4 Mevsim Lastikleri', slug='4-mevsim-lastikleri', parent=lastik)
        Category.objects.create(name='Kamyon Lastikleri', slug='kamyon-lastikleri', parent=lastik)
        
        # Akü kategorileri
        aku = Category.objects.create(name='Akü', slug='aku', parent=otomotiv)
        Category.objects.create(name='Oto Aküleri', slug='oto-akulleri', parent=aku)
        Category.objects.create(name='Kamyon Aküleri', slug='kamyon-akulleri', parent=aku)
        Category.objects.create(name='Jel Aküler', slug='jel-akular', parent=aku)
        
        # Jant kategorileri
        jant = Category.objects.create(name='Jant', slug='jant', parent=otomotiv)
        Category.objects.create(name='Çelik Jantlar', slug='celik-jantlar', parent=jant)
        Category.objects.create(name='Alaşım Jantlar', slug='alasim-jantlar', parent=jant)
        
        # Yedek parça kategorileri
        yedek_parca = Category.objects.create(name='Yedek Parçalar', slug='yedek-parcalar', parent=otomotiv)
        Category.objects.create(name='Fren Sistemleri', slug='fren-sistemleri', parent=yedek_parca)
        Category.objects.create(name='Suspensiyon', slug='suspensiyon', parent=yedek_parca)
        
        # Motor yağları
        motor_yaglari = Category.objects.create(name='Motor Yağları', slug='motor-yaglari', parent=otomotiv)
        Category.objects.create(name='Sentetik Yağlar', slug='sentetik-yaglar', parent=motor_yaglari)
        Category.objects.create(name='Mineral Yağlar', slug='mineral-yaglar', parent=motor_yaglari)

    def _create_companies_and_users(self):
        """Creates wholesalers and retailers with subscriptions and users."""
        pro_plan = SubscriptionPlan.objects.get(plan_type='pro')
        ultra_plan = SubscriptionPlan.objects.get(plan_type='ultra')

        # 1. Create a Superuser (Admin) - Not tied to any company/subscription
        User.objects.create_superuser(
            email='admin@tyrex.com',
            password='admin123',
            first_name='Tyrex',
            last_name='Admin',
            is_staff=True,
            is_superuser=True
        )

        # 2. Create ULTRA Wholesaler Company
        ultra_wholesaler_company = Company.objects.create(
            name='Lider Lastik Toptan',
            company_type='wholesaler',
            email='info@liderlastiktoptan.com',
            phone=fake.phone_number()[:20],
            address=fake.address(),
            is_active=True
        )
        Subscription.objects.create(company=ultra_wholesaler_company, plan=ultra_plan, status='active')

        # 3. Create PRO Retailer Company and User
        pro_retailer_company = Company.objects.create(
            name='Güven Oto Lastik',
            company_type='retailer',
            email='iletisim@guvenotolastik.com',
            phone=fake.phone_number()[:20],
            address=fake.address(),
            is_active=True
        )
        Subscription.objects.create(company=pro_retailer_company, plan=pro_plan, status='active')
        User.objects.create_user(
            email='pro@guvenotolastik.com',
            password='pro123',
            first_name='Ayşe',
            last_name='Yılmaz',
            company=pro_retailer_company
        )

        # 4. Create ULTRA Retailer Company and User
        ultra_retailer_company = Company.objects.create(
            name='Mega Lastik Merkezi',
            company_type='retailer',
            email='destek@megalastikmerkezi.com',
            phone=fake.phone_number()[:20],
            address=fake.address(),
            is_active=True
        )
        Subscription.objects.create(company=ultra_retailer_company, plan=ultra_plan, status='active')
        User.objects.create_user(
            email='ultra@megalastikmerkezi.com',
            password='ultra123',
            first_name='Can',
            last_name='Demir',
            company=ultra_retailer_company
        )
        
        # Create relationships with random discount rates
        RetailerWholesaler.objects.create(retailer=pro_retailer_company, wholesaler=ultra_wholesaler_company, discount_rate=Decimal(str(random.uniform(1.0, 15.0))))
        RetailerWholesaler.objects.create(retailer=ultra_retailer_company, wholesaler=ultra_wholesaler_company, discount_rate=Decimal(str(random.uniform(1.0, 15.0))))

    def _create_products(self):
        """Creates detailed products with proper specifications."""
        # Lastik ürünleri
        tire_brands = ['Pirelli', 'Michelin', 'Continental', 'Bridgestone', 'Goodyear']
        tire_sizes = [
            ('225', '45', '17'),
            ('205', '55', '16'), 
            ('195', '65', '15'),
            ('215', '60', '16'),
            ('235', '40', '18'),
            ('315', '80', '22.5')  # Kamyon lastiği
        ]
        
        # Yaz lastikleri
        yaz_category = Category.objects.get(slug='yaz-lastikleri')
        for brand in tire_brands:
            for width, ratio, diameter in tire_sizes:
                if diameter == '22.5':  # Kamyon lastiği değil
                    continue
                Product.objects.create(
                    name=f'{brand} Yaz Lastiği {width}/{ratio} R{diameter}',
                    slug=f'{brand.lower()}-yaz-{width}-{ratio}-{diameter}',
                    sku=f'{brand[:3].upper()}-YAZ-{width}{ratio}{diameter}',
                    brand=brand,
                    category=yaz_category,
                    tire_width=width,
                    tire_aspect_ratio=ratio,
                    tire_diameter=diameter,
                    description=f'Yüksek performanslı {brand} yaz lastiği.',
                    weight=Decimal(str(random.uniform(8.5, 12.5)))
                )
        
        # Kış lastikleri
        kis_category = Category.objects.get(slug='kis-lastikleri')
        for brand in tire_brands:
            for width, ratio, diameter in tire_sizes[:4]:  # İlk 4 ebat
                Product.objects.create(
                    name=f'{brand} Kış Lastiği {width}/{ratio} R{diameter}',
                    slug=f'{brand.lower()}-kis-{width}-{ratio}-{diameter}',
                    sku=f'{brand[:3].upper()}-KIS-{width}{ratio}{diameter}',
                    brand=brand,
                    category=kis_category,
                    tire_width=width,
                    tire_aspect_ratio=ratio,
                    tire_diameter=diameter,
                    description=f'Güvenli {brand} kış lastiği.',
                    weight=Decimal(str(random.uniform(9.0, 13.0)))
                )
        
        # 4 Mevsim lastikleri
        dort_mevsim_category = Category.objects.get(slug='4-mevsim-lastikleri')
        for brand in tire_brands:
            for width, ratio, diameter in tire_sizes[:3]:  # İlk 3 ebat
                Product.objects.create(
                    name=f'{brand} 4 Mevsim Lastiği {width}/{ratio} R{diameter}',
                    slug=f'{brand.lower()}-4mevsim-{width}-{ratio}-{diameter}',
                    sku=f'{brand[:3].upper()}-4MV-{width}{ratio}{diameter}',
                    brand=brand,
                    category=dort_mevsim_category,
                    tire_width=width,
                    tire_aspect_ratio=ratio,
                    tire_diameter=diameter,
                    description=f'Her mevsim kullanıma uygun {brand} lastiği.',
                    weight=Decimal(str(random.uniform(8.8, 12.8)))
                )
        
        # Kamyon lastikleri
        kamyon_category = Category.objects.get(slug='kamyon-lastikleri')
        kamyon_brands = ['Bridgestone', 'Michelin', 'Continental']
        kamyon_sizes = [('315', '80', '22.5'), ('385', '65', '22.5')]
        for brand in kamyon_brands:
            for width, ratio, diameter in kamyon_sizes:
                Product.objects.create(
                    name=f'{brand} Kamyon Lastiği {width}/{ratio} R{diameter}',
                    slug=f'{brand.lower()}-kamyon-{width}-{ratio}-{diameter}',
                    sku=f'{brand[:3].upper()}-KAM-{width}{ratio}{diameter}',
                    brand=brand,
                    category=kamyon_category,
                    tire_width=width,
                    tire_aspect_ratio=ratio,
                    tire_diameter=diameter,
                    description=f'Ağır hizmet {brand} kamyon lastiği.',
                    weight=Decimal(str(random.uniform(45.0, 65.0)))
                )
        
        # Akü ürünleri
        battery_brands = ['Varta', 'Bosch', 'Mutlu', 'İnci']
        oto_aku_category = Category.objects.get(slug='oto-akulleri')
        battery_capacities = ['60Ah', '74Ah', '85Ah', '100Ah']
        
        for brand in battery_brands:
            for capacity in battery_capacities:
                Product.objects.create(
                    name=f'{brand} Oto Akü {capacity}',
                    slug=f'{brand.lower()}-oto-aku-{capacity.lower()}',
                    sku=f'{brand[:3].upper()}-AKU-{capacity.replace("Ah", "")}',
                    brand=brand,
                    category=oto_aku_category,
                    battery_ampere=capacity,
                    battery_voltage='12V',
                    description=f'Güvenilir {brand} oto akü.',
                    weight=Decimal(str(random.uniform(15.0, 25.0)))
                )
        
        # Jant ürünleri
        jant_brands = ['Mercedes', 'BMW', 'Audi', 'OZ Racing', 'BBS']
        alasim_jant_category = Category.objects.get(slug='alasim-jantlar')
        jant_sizes = ['17"', '18"', '19"', '20"']
        bolt_patterns = ['5x112', '5x120', '4x100']
        
        for brand in jant_brands:
            for size in jant_sizes:
                for pattern in bolt_patterns:
                    slug_size = size.replace('"', 'inc')
                    sku_size = size.replace('"', '')
                    sku_pattern = pattern.replace('x', '')
                    random_id = random.randint(1000, 9999)
                    Product.objects.create(
                        name=f'{brand} Alaşım Jant {size}',
                        slug=f'{brand.lower()}-jant-{slug_size}-{pattern.replace("x", "")}-{random_id}',
                        sku=f'{brand[:3].upper()}-JNT-{sku_size}{sku_pattern}-{random_id}',
                        brand=brand,
                        category=alasim_jant_category,
                        rim_size=size,
                        rim_bolt_pattern=pattern,
                        description=f'Şık {brand} alaşım jant.',
                        weight=Decimal(str(random.uniform(8.0, 15.0)))
                    )

    def _create_warehouses_and_stock(self):
        """Creates warehouses for the wholesaler and populates them with stock."""
        wholesaler = Company.objects.get(name='Lider Lastik Toptan')
        products = list(Product.objects.all())

        # Ana depo
        ana_depo = Warehouse.objects.create(
            name='Lider Lastik Ana Depo',
            code='LLD-ANA-001',
            company=wholesaler,
            address=fake.address(),
            city='İstanbul',
            storage_capacity=10000
        )
        
        # Dağıtım merkezi
        dagitim_depo = Warehouse.objects.create(
            name='Lider Lastik Dağıtım Merkezi',
            code='LLD-DAG-002',
            company=wholesaler,
            address=fake.address(),
            city='Ankara',
            storage_capacity=5000,
            warehouse_type='distribution'
        )

        warehouses = [ana_depo, dagitim_depo]
        
        for warehouse in warehouses:
            # Her depoda farklı ürünler olsun
            selected_products = random.sample(products, k=min(len(products), 60))
            
            for product in selected_products:
                # Ürün tipine göre farklı fiyat aralıkları
                if product.category.parent and product.category.parent.slug == 'lastik':
                    if 'Kamyon' in product.category.name:
                        cost_price = Decimal(str(random.uniform(2000, 4000)))
                        sale_price = cost_price * Decimal(str(random.uniform(1.15, 1.35)))
                    else:
                        cost_price = Decimal(str(random.uniform(800, 1800)))
                        sale_price = cost_price * Decimal(str(random.uniform(1.20, 1.40)))
                elif product.category.parent and product.category.parent.slug == 'aku':
                    cost_price = Decimal(str(random.uniform(600, 1200)))
                    sale_price = cost_price * Decimal(str(random.uniform(1.25, 1.45)))
                elif product.category.parent and product.category.parent.slug == 'jant':
                    cost_price = Decimal(str(random.uniform(1500, 4000)))
                    sale_price = cost_price * Decimal(str(random.uniform(1.18, 1.30)))
                else:
                    cost_price = Decimal(str(random.uniform(500, 1500)))
                    sale_price = cost_price * Decimal(str(random.uniform(1.20, 1.40)))
                
                StockItem.objects.create(
                    product=product,
                    warehouse=warehouse,
                    quantity=random.randint(5, 80),
                    minimum_stock=random.randint(5, 15),
                    maximum_stock=random.randint(100, 200),
                    cost_price=cost_price,
                    sale_price=sale_price,
                    location_code=f'{random.choice(["A", "B", "C", "D"])}{random.randint(1, 10)}-{random.choice(["1", "2", "3", "4"])}',
                    barcode=f'BC-{random.randint(100000, 999999)}'
                )

    def _create_customers_and_related_data(self):
        """Creates customers for the PRO retailer and adds tires/visits."""
        pro_retailer = Company.objects.get(name='Güven Oto Lastik')
        for _ in range(15):
            customer = Customer.objects.create(
                name=fake.name(),
                wholesaler=pro_retailer, # In our context, the retailer is the wholesaler for the end customer
                customer_type=random.choice(['individual', 'business']),
                email=fake.email(),
                phone=fake.phone_number()[:20], # Daha gerçekçi telefon numarası
                address=fake.address(),
                is_active=True
            )
            StoredTire.objects.create(
                customer=customer,
                tire_brand=random.choice(['Lassa', 'Bridgestone', 'Michelin', 'Goodyear', 'Pirelli']),
                tire_model=f'Model-{random.randint(100,200)}',
                tire_size='205/55 R16',
                quantity=4,
                storage_location=f'Raf-{random.randint(1, 20)}'
            )
            CustomerVisit.objects.create(
                customer=customer,
                visit_type='purchase',
                visit_date=timezone.now(),
                description='Yaz lastiği satın alımı.'
            )

    def _create_orders(self):
        """Creates orders from the retailer to the wholesaler, applying discount rates."""
        pro_retailer = Company.objects.get(name='Güven Oto Lastik')
        ultra_wholesaler = Company.objects.get(name='Lider Lastik Toptan')
        pro_retailer_user = User.objects.get(company=pro_retailer)
        stock_items = list(StockItem.objects.filter(warehouse__company=ultra_wholesaler))
        
        # Get the discount rate for this specific retailer-wholesaler relationship
        retailer_wholesaler_rel = RetailerWholesaler.objects.get(retailer=pro_retailer, wholesaler=ultra_wholesaler)
        discount_rate = retailer_wholesaler_rel.discount_rate

        for _ in range(5):
            order = Order.objects.create(
                retailer=pro_retailer,
                wholesaler=ultra_wholesaler,
                retailer_user=pro_retailer_user,
                status='completed',
                subtotal=Decimal('0.00'),
                tax_amount=Decimal('0.00'),
                shipping_cost=Decimal('0.00'),
                discount_amount=Decimal('0.00'),
                total_amount=Decimal('0.00'),
                order_number=f"ORD-{fake.unique.uuid4().replace('-', '').upper()[:10]}"
            )
            total_amount = Decimal(0)
            for item in random.sample(stock_items, k=min(len(stock_items), 3)):
                quantity = random.randint(1, 5)
                price = item.sale_price
                
                # Apply discount
                discount_amount_item = (price * discount_rate) / 100
                discounted_price = price - discount_amount_item
                
                total_price = quantity * discounted_price
                total_amount += total_price
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    warehouse=item.warehouse,
                    stock_item=item,
                    quantity=quantity,
                    unit_price=price, # Original price
                    wholesaler_reference_price=price, # Original price
                    total_price=total_price, # Discounted total price
                    discount_percentage=discount_rate,
                    discount_amount=discount_amount_item * quantity
                )
            order.total_amount = total_amount
            order.save()