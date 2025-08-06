from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
from customers.models import Customer, CustomerVisit, StoredTire
from companies.models import Company
from users.models import User
import random

class Command(BaseCommand):
    help = 'Creates sample customer data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='Number of customers to create'
        )

    def handle(self, *args, **options):
        count = options['count']
        
        # Get all wholesaler companies
        wholesalers = Company.objects.filter(company_type__in=['wholesaler', 'both'])
        
        if not wholesalers.exists():
            self.stdout.write(
                self.style.ERROR('No wholesaler companies found. Please create some companies first.')
            )
            return
        
        # Sample customer data
        individual_names = [
            'Mehmet Yılmaz', 'Ahmet Demir', 'Fatma Kaya', 'Ayşe Şahin', 
            'Mustafa Çelik', 'Zeynep Aydın', 'Hasan Polat', 'Elif Arslan',
            'Ali Koç', 'Gülhan Özkan'
        ]
        
        company_names = [
            'ABC Nakliyat', 'XYZ Lojistik', 'Ankara Taksi Kooperatifi',
            'İstanbul Oto Galeri', 'Bursa Filo Yönetimi', 'Denizli Transport',
            'Gaziantep Nakliye', 'Adana Oto Servisi', 'Konya Fleet Management',
            'Trabzon Logistics'
        ]
        
        tire_brands = ['Bridgestone', 'Michelin', 'Continental', 'Pirelli', 'Goodyear', 'Toyo', 'Hankook']
        tire_models = ['EcoMax', 'SportContact', 'PrimacyHP', 'WinterMax', 'AllSeason', 'TurkMax']
        tire_sizes = ['195/65R15', '205/55R16', '225/45R17', '235/60R18', '185/60R14', '215/65R16']
        
        users = list(User.objects.all())
        
        created_customers = 0
        
        for i in range(count):
            wholesaler = random.choice(wholesalers)
            
            # Customer type selection
            customer_type = random.choice(['individual', 'business', 'fleet'])
            
            if customer_type == 'individual':
                name = random.choice(individual_names)
                company_name = None
            else:
                name = f"{random.choice(['Ali', 'Mehmet', 'Ahmet', 'Mustafa'])} {random.choice(['Yılmaz', 'Demir', 'Kaya', 'Şahin'])}"
                company_name = random.choice(company_names)
            
            # Create customer
            customer = Customer.objects.create(
                name=name,
                customer_type=customer_type,
                wholesaler=wholesaler,
                email=f"customer{i+1}@example.com" if random.random() > 0.3 else None,
                phone=f"05{random.randint(10, 99)}{random.randint(1000000, 9999999)}" if random.random() > 0.2 else None,
                company_name=company_name,
                customer_code=f"CUST{random.randint(1000, 9999)}",
                credit_limit=Decimal(str(random.randint(5000, 50000))) if random.random() > 0.3 else None,
                payment_terms_days=random.choice([15, 30, 45, 60]),
                discount_rate=Decimal(str(random.randint(0, 15))),
                is_active=random.random() > 0.1,
                is_vip=random.random() > 0.7,
                tire_hotel_enabled=random.random() > 0.5,
                tire_storage_capacity=random.randint(8, 40) if random.random() > 0.6 else None,
                notes=f"Sample customer {i+1}" if random.random() > 0.5 else None
            )
            
            created_customers += 1
            
            # Create some visits for this customer
            num_visits = random.randint(1, 5)
            for j in range(num_visits):
                visit_date = timezone.now() - timedelta(days=random.randint(1, 90))
                visit_type = random.choice(['purchase', 'tire_storage', 'tire_pickup', 'maintenance', 'consultation'])
                
                CustomerVisit.objects.create(
                    customer=customer,
                    visit_type=visit_type,
                    visit_date=visit_date,
                    description=f"{visit_type.replace('_', ' ').title()} işlemi gerçekleştirildi.",
                    sale_amount=Decimal(str(random.randint(500, 5000))) if visit_type == 'purchase' else None,
                    served_by=random.choice(users) if users and random.random() > 0.3 else None,
                    is_completed=True,
                    duration_minutes=random.randint(15, 120) if random.random() > 0.5 else None,
                    customer_satisfaction=random.randint(3, 5) if random.random() > 0.3 else None
                )
            
            # Create stored tires if tire hotel is enabled
            if customer.tire_hotel_enabled and random.random() > 0.3:
                num_stored_tires = random.randint(1, 3)
                for j in range(num_stored_tires):
                    storage_date = timezone.now() - timedelta(days=random.randint(1, 180))
                    
                    StoredTire.objects.create(
                        customer=customer,
                        tire_brand=random.choice(tire_brands),
                        tire_model=random.choice(tire_models),
                        tire_size=random.choice(tire_sizes),
                        tire_season=random.choice(['summer', 'winter', 'all_season']),
                        quantity=4,  # Usually a full set
                        has_rims=random.random() > 0.5,
                        tire_condition=random.choice(['excellent', 'good', 'fair']),
                        production_year=random.randint(2020, 2024) if random.random() > 0.3 else None,
                        storage_location=f"Raf-{random.choice(['A', 'B', 'C'])}{random.randint(1, 20)}",
                        storage_date=storage_date,
                        planned_pickup_date=date.today() + timedelta(days=random.randint(30, 180)) if random.random() > 0.4 else None,
                        is_active=random.random() > 0.2,  # Most are still active
                        storage_fee_monthly=Decimal(str(random.randint(30, 100))) if random.random() > 0.5 else None,
                        notes=f"Müşteri {customer.name} için depolanmış lastikler" if random.random() > 0.7 else None
                    )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_customers} sample customers with visits and stored tires.')
        )