from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from subscriptions.models import SubscriptionPlan, Subscription
from companies.models import Company


class Command(BaseCommand):
    help = 'Abonelik planları ve örnek abonelikler oluşturur'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Mevcut abonelik verilerini temizle',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('🗑️ Mevcut abonelik verileri temizleniyor...'))
            Subscription.objects.all().delete()
            SubscriptionPlan.objects.all().delete()

        try:
            with transaction.atomic():
                self.create_subscription_plans()
                self.create_sample_subscriptions()
                self.stdout.write(self.style.SUCCESS('✅ Abonelik verileri başarıyla oluşturuldu!'))
                self.print_summary()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Hata oluştu: {str(e)}'))
            raise

    def create_subscription_plans(self):
        """Abonelik planlarını oluştur"""
        self.stdout.write('📋 Abonelik planları oluşturuluyor...')
        
        plans_data = [
            {
                'name': 'Ücretsiz Plan',
                'plan_type': 'free',
                'description': 'Başlangıç seviyesi işletmeler için temel özellikler',
                'monthly_price': Decimal('0.00'),
                'yearly_price': Decimal('0.00'),
                'max_users': 1,
                'max_warehouses': 1,
                'max_products': 50,
                'api_rate_limit': 100,
                'marketplace_access': False,
                'dynamic_pricing': False,
                'advanced_analytics': False,
                'priority_support': False,
                'tyrex_commission_rate': Decimal('0.00'),
                'sort_order': 1
            },
            {
                'name': 'Temel Plan',
                'plan_type': 'basic',
                'description': 'Küçük işletmeler için pazaryeri erişimi dahil',
                'monthly_price': Decimal('299.00'),
                'yearly_price': Decimal('2990.00'),  # 2 aylık indirim
                'max_users': 3,
                'max_warehouses': 2,
                'max_products': 500,
                'api_rate_limit': 1000,
                'marketplace_access': True,
                'dynamic_pricing': True,
                'advanced_analytics': False,
                'priority_support': False,
                'tyrex_commission_rate': Decimal('2.50'),
                'sort_order': 2
            },
            {
                'name': 'Premium Plan',
                'plan_type': 'premium',
                'description': 'Orta ölçekli işletmeler için gelişmiş özellikler',
                'monthly_price': Decimal('599.00'),
                'yearly_price': Decimal('5990.00'),  # 2 aylık indirim
                'max_users': 10,
                'max_warehouses': 5,
                'max_products': 2000,
                'api_rate_limit': 5000,
                'marketplace_access': True,
                'dynamic_pricing': True,
                'advanced_analytics': True,
                'priority_support': False,
                'tyrex_commission_rate': Decimal('2.00'),  # Daha düşük komisyon
                'sort_order': 3
            },
            {
                'name': 'Kurumsal Plan',
                'plan_type': 'enterprise',
                'description': 'Büyük işletmeler için sınırsız özellikler',
                'monthly_price': Decimal('1299.00'),
                'yearly_price': Decimal('12990.00'),  # 2 aylık indirim
                'max_users': 50,
                'max_warehouses': 20,
                'max_products': 10000,
                'api_rate_limit': 20000,
                'marketplace_access': True,
                'dynamic_pricing': True,
                'advanced_analytics': True,
                'priority_support': True,
                'tyrex_commission_rate': Decimal('1.50'),  # En düşük komisyon
                'sort_order': 4
            }
        ]
        
        plans = []
        for plan_data in plans_data:
            plan, created = SubscriptionPlan.objects.get_or_create(
                plan_type=plan_data['plan_type'],
                defaults=plan_data
            )
            plans.append(plan)
            
            if created:
                self.stdout.write(f'  ✅ {plan.name} oluşturuldu')
            else:
                self.stdout.write(f'  ⚠️ {plan.name} zaten mevcut')
        
        return plans

    def create_sample_subscriptions(self):
        """Örnek abonelikler oluştur"""
        self.stdout.write('👥 Şirketler için abonelikler oluşturuluyor...')
        
        # Planları al
        try:
            free_plan = SubscriptionPlan.objects.get(plan_type='free')
            basic_plan = SubscriptionPlan.objects.get(plan_type='basic')
            premium_plan = SubscriptionPlan.objects.get(plan_type='premium')
            enterprise_plan = SubscriptionPlan.objects.get(plan_type='enterprise')
        except SubscriptionPlan.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Abonelik planları bulunamadı!'))
            return
        
        # Şirketleri al
        companies = Company.objects.filter(company_type='retailer')
        if not companies.exists():
            self.stdout.write(self.style.WARNING('⚠️ Hiç perakendeci şirket bulunamadı!'))
            return
        
        # Abonelik senaryoları
        subscription_scenarios = [
            {
                'company_name': 'Premium Lastik Mağazası',
                'plan': premium_plan,
                'status': 'active',
                'billing_cycle': 'monthly',
                'current_users': 2,
                'current_warehouses': 2,
                'current_products': 150,
                'api_calls_this_month': 450,
                'notes': 'Premium müşteri - pazaryeri aktif kullanıcısı'
            },
            {
                'company_name': 'Hızlı Lastik Zinciri',
                'plan': basic_plan,
                'status': 'active',
                'billing_cycle': 'yearly',
                'current_users': 1,
                'current_warehouses': 1,
                'current_products': 80,
                'api_calls_this_month': 120,
                'notes': 'Yıllık ödeme ile temel plan kullanıcısı'
            },
            {
                'company_name': 'Aile İşletmesi Lastikçi',
                'plan': free_plan,
                'status': 'trialing',
                'billing_cycle': 'monthly',
                'current_users': 1,
                'current_warehouses': 1,
                'current_products': 25,
                'api_calls_this_month': 15,
                'notes': 'Deneme sürümünde - pazaryeri erişimi yok'
            },
            {
                'company_name': 'Mega Lastik Market',
                'plan': enterprise_plan,
                'status': 'active',
                'billing_cycle': 'yearly',
                'current_users': 5,
                'current_warehouses': 3,
                'current_products': 800,
                'api_calls_this_month': 2500,
                'notes': 'Kurumsal müşteri - en yüksek seviye özellikler'
            },
            {
                'company_name': 'Üniversite Lastik Servisi',
                'plan': basic_plan,
                'status': 'trialing',
                'billing_cycle': 'monthly',
                'current_users': 1,
                'current_warehouses': 1,
                'current_products': 45,
                'api_calls_this_month': 75,
                'notes': 'Temel plan deneme sürümünde'
            }
        ]
        
        created_count = 0
        for scenario in subscription_scenarios:
            try:
                company = companies.get(name=scenario['company_name'])
                
                # Mevcut abonelik var mı kontrol et
                existing_subscription = Subscription.objects.filter(company=company).first()
                if existing_subscription:
                    self.stdout.write(f'  ⚠️ {company.name} zaten aboneliği var')
                    continue
                
                subscription = Subscription.objects.create(
                    company=company,
                    plan=scenario['plan'],
                    status=scenario['status'],
                    billing_cycle=scenario['billing_cycle'],
                    current_users=scenario['current_users'],
                    current_warehouses=scenario['current_warehouses'],
                    current_products=scenario['current_products'],
                    api_calls_this_month=scenario['api_calls_this_month'],
                    notes=scenario['notes']
                )
                
                created_count += 1
                self.stdout.write(
                    f'  ✅ {company.name} - {subscription.plan.name} '
                    f'({subscription.get_status_display()})'
                )
                
            except Company.DoesNotExist:
                self.stdout.write(
                    f'  ❌ Şirket bulunamadı: {scenario["company_name"]}'
                )
                continue
        
        self.stdout.write(f'📊 Toplam {created_count} abonelik oluşturuldu')

    def print_summary(self):
        """Özet rapor yazdır"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('📊 ABONELİK SİSTEMİ ÖZETİ'))
        self.stdout.write('='*60)
        
        # Plan istatistikleri
        self.stdout.write('📋 Abonelik Planları:')
        for plan in SubscriptionPlan.objects.all().order_by('sort_order'):
            active_subs = plan.subscriptions.filter(status__in=['active', 'trialing']).count()
            self.stdout.write(
                f'  • {plan.name}: ₺{plan.monthly_price}/ay '
                f'({active_subs} aktif abone)'
            )
        
        # Abonelik durumları
        self.stdout.write(f'\n📈 Abonelik Durumları:')
        total_subs = Subscription.objects.count()
        for status_code, status_name in Subscription.STATUS_CHOICES:
            count = Subscription.objects.filter(status=status_code).count()
            if count > 0:
                percentage = (count / total_subs * 100) if total_subs > 0 else 0
                self.stdout.write(f'  • {status_name}: {count} (%{percentage:.1f})')
        
        # Pazaryeri erişimi
        marketplace_access_count = Subscription.objects.filter(
            status__in=['active', 'trialing'],
            plan__marketplace_access=True
        ).count()
        
        self.stdout.write(f'\n🏪 Pazaryeri Erişimi:')
        self.stdout.write(f'  • Erişimi olan şirketler: {marketplace_access_count}')
        
        # Test bilgileri
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('🧪 TEST BİLGİLERİ'))
        self.stdout.write('='*60)
        
        test_scenarios = [
            ('Premium Lastik - Ahmet', 'ahmet@premiumlastik.com', 'Premium Plan', 'Pazaryeri ✅'),
            ('Hızlı Lastik - Mehmet', 'mehmet@hizlilastik.com', 'Temel Plan', 'Pazaryeri ✅'),
            ('Aile Lastikçi - Fatma', 'fatma@ailelastik.com', 'Ücretsiz Plan', 'Pazaryeri ❌'),
            ('Mega Lastik - Ali', 'ali@megalastikmarket.com', 'Kurumsal Plan', 'Pazaryeri ✅'),
            ('Üniversite Lastik - Zeynep', 'zeynep@unilastik.com', 'Temel Plan (Deneme)', 'Pazaryeri ✅')
        ]
        
        for name, email, plan, access in test_scenarios:
            self.stdout.write(f'🔑 {name}: {email} - {plan} - {access}')
        
        self.stdout.write(f'\n🎯 Test edilecek endpoint\'ler:')
        self.stdout.write(f'  • GET /api/v1/market/products/ (Pazaryeri erişimi gerekli)')
        self.stdout.write(f'  • GET /api/v1/market/stats/ (İstatistikler)')
        self.stdout.write(f'  • GET /api/v1/health/ (Sağlık kontrolü)')
        
        self.stdout.write(f'\n✨ FAZ 4 test edilmeye hazır!')