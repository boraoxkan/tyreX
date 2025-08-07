from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from companies.models import Company
from subscriptions.models import SubscriptionPlan, Subscription
import datetime
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Demo kullanıcıları ve şirketleri oluşturur'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("🏭 Demo şirketler ve kullanıcılar oluşturuluyor..."))
        
        with transaction.atomic():
            # Mevcut demo verilerini temizle
            User.objects.filter(email__in=[
                'ahmet@premiumlastik.com',
                'mehmet@hizlilastik.com', 
                'admin@tyrex.com'
            ]).delete()
            
            Company.objects.filter(name__in=[
                'Premium Lastik AŞ',
                'Hızlı Lastik Ltd'
            ]).delete()

            # Abonelik planlarını getir
            plans = {
                'pro': SubscriptionPlan.objects.get(plan_type='pro'),
                'ultra': SubscriptionPlan.objects.get(plan_type='ultra'),
            }

            # 1. Admin kullanıcısı
            admin_user = User.objects.create_user(
                email='admin@tyrex.com',
                password='admin123',
                first_name='Admin',
                last_name='User',
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write("  ✅ Admin kullanıcısı oluşturuldu")

            # 2. Premium Lastik AŞ - ULTRA Plan
            ultra_company = Company.objects.create(
                name='Premium Lastik AŞ',
                company_type='both',  # Hem perakendeci hem toptancı
                address='İstanbul Ticaret Merkezi, Beyoğlu/İstanbul',
                phone='+90 212 555 0101',
                email='info@premiumlastik.com'
            )
            
            ultra_user = User.objects.create_user(
                email='ahmet@premiumlastik.com',
                password='ahmet123',
                first_name='Ahmet',
                last_name='Kaya',
                company=ultra_company
            )
            
            ultra_subscription = Subscription.objects.create(
                company=ultra_company,
                plan=plans['ultra'],
                status='active',
                start_date=datetime.datetime.now(),
                current_period_end=datetime.datetime.now() + datetime.timedelta(days=30)
            )
            self.stdout.write("  ✅ Premium Lastik AŞ oluşturuldu (ULTRA Plan)")

            # 3. Hızlı Lastik Ltd - PRO Plan  
            pro_company = Company.objects.create(
                name='Hızlı Lastik Ltd',
                company_type='wholesaler',  # Toptancı - sadece müşteri takibi için
                address='Ankara Sanayi Sitesi, Çankaya/Ankara',
                phone='+90 312 555 0202',
                email='info@hizlilastik.com'
            )
            
            pro_user = User.objects.create_user(
                email='mehmet@hizlilastik.com',
                password='mehmet123',
                first_name='Mehmet',
                last_name='Demir',
                company=pro_company
            )
            
            pro_subscription = Subscription.objects.create(
                company=pro_company,
                plan=plans['pro'],
                status='active',
                start_date=datetime.datetime.now(),
                current_period_end=datetime.datetime.now() + datetime.timedelta(days=30)
            )
            self.stdout.write("  ✅ Hızlı Lastik Ltd oluşturuldu (PRO Plan)")


        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("🎉 DEMO KULLANICILAR OLUŞTURULDU!"))
        self.stdout.write("="*60)
        
        # Oluşturulan hesapları listele
        self.stdout.write("\n📋 DEMO HESAPLAR:")
        
        demo_accounts = [
            ("admin@tyrex.com", "admin123", "Admin User", "Sistem Yöneticisi"),
            ("ahmet@premiumlastik.com", "ahmet123", "Ahmet Kaya", "ULTRA Plan - Premium Lastik AŞ"),
            ("mehmet@hizlilastik.com", "mehmet123", "Mehmet Demir", "PRO Plan - Hızlı Lastik Ltd"),
        ]
        
        for email, password, name, plan in demo_accounts:
            self.stdout.write(f"  🔐 {email} | {password} | {name} | {plan}")
        
        self.stdout.write("\n✨ Tüm hesaplar hazır! Login sayfasından giriş yapabilirsiniz.")