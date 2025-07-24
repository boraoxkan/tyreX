from django.core.management.base import BaseCommand
from django.db import transaction
from companies.models import Company, RetailerWholesaler
from products.models import Category, Attribute, Product, ProductAttributeValue
from inventory.models import Warehouse, StockItem
from decimal import Decimal
import random

class Command(BaseCommand):
    help = 'Doğrulama için örnek veri oluşturur'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Mevcut verileri temizle ve yeniden oluştur',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(
                self.style.WARNING('Mevcut veriler temizleniyor...')
            )
            self.clear_existing_data()

        try:
            with transaction.atomic():
                self.create_sample_data()
                self.stdout.write(
                    self.style.SUCCESS('✅ Örnek veriler başarıyla oluşturuldu!')
                )
                self.print_summary()
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Hata oluştu: {str(e)}')
            )
            raise

    def clear_existing_data(self):
        """Mevcut test verilerini temizle"""
        StockItem.objects.all().delete()
        Warehouse.objects.all().delete()
        ProductAttributeValue.objects.all().delete()
        Product.objects.all().delete()
        Attribute.objects.all().delete()
        Category.objects.all().delete()
        RetailerWholesaler.objects.all().delete()
        Company.objects.all().delete()

    def create_sample_data(self):
        """Örnek verileri oluştur"""
        
        # 1. ŞİRKETLER OLUŞTUR
        self.stdout.write('📊 Şirketler oluşturuluyor...')
        
        # Toptancı A
        toptanci_a = Company.objects.create(
            name='Toptancı A',
            company_type='wholesaler',
            is_managed_by_tyrex=True,
            email='info@toptancia.com',
            phone='+90 312 123 45 67',
            address='Ostim Sanayi Sitesi, Ankara',
            is_active=True
        )
        
        # Perakendeci X
        perakendeci_x = Company.objects.create(
            name='Perakendeci X',
            company_type='retailer',
            is_managed_by_tyrex=True,
            email='info@perakendecix.com',
            phone='+90 212 987 65 43',
            address='Levent, İstanbul',
            is_active=True
        )
        
        # Ek toptancılar
        toptanci_b = Company.objects.create(
            name='Büyük Lastik A.Ş.',
            company_type='wholesaler',
            is_managed_by_tyrex=False,
            email='info@buyuklastik.com',
            phone='+90 232 555 66 77',
            address='Kemeraltı, İzmir'
        )
        
        # Ek perakendeciler
        perakendeci_y = Company.objects.create(
            name='Hızlı Lastik Merkezi',
            company_type='retailer',
            is_managed_by_tyrex=True,
            email='info@hizlilastik.com',
            phone='+90 224 444 55 66',
            address='Osmangazi, Bursa'
        )

        # 2. ŞİRKET İLİŞKİLERİ OLUŞTUR
        self.stdout.write('🔗 Şirket ilişkileri oluşturuluyor...')
        
        # Perakendeci X - Toptancı A ilişkisi
        RetailerWholesaler.objects.create(
            retailer=perakendeci_x,
            wholesaler=toptanci_a,
            is_active=True,
            credit_limit=Decimal('50000.00'),
            payment_terms_days=30,
            notes='Güvenilir müşteri, düzenli alım yapar'
        )
        
        # Perakendeci Y - Toptancı A ilişkisi
        RetailerWholesaler.objects.create(
            retailer=perakendeci_y,
            wholesaler=toptanci_a,
            is_active=True,
            credit_limit=Decimal('25000.00'),
            payment_terms_days=45
        )
        
        # Perakendeci X - Toptancı B ilişkisi
        RetailerWholesaler.objects.create(
            retailer=perakendeci_x,
            wholesaler=toptanci_b,
            is_active=True,
            credit_limit=Decimal('30000.00'),
            payment_terms_days=15
        )

        # 3. KATEGORİLER OLUŞTUR
        self.stdout.write('📂 Kategoriler oluşturuluyor...')
        
        # Ana kategoriler
        otomobil_cat = Category.objects.create(
            name='Otomobil Lastikleri',
            slug='otomobil-lastikleri',
            description='Binek araç lastikleri',
            sort_order=1
        )
        
        kamyon_cat = Category.objects.create(
            name='Kamyon Lastikleri',
            slug='kamyon-lastikleri', 
            description='Ağır vasıta lastikleri',
            sort_order=2
        )
        
        # Alt kategoriler
        yaz_lastigi = Category.objects.create(
            name='Yaz Lastikleri',
            slug='yaz-lastikleri',
            parent=otomobil_cat,
            sort_order=1
        )
        
        kis_lastigi = Category.objects.create(
            name='Kış Lastikleri',
            slug='kis-lastikleri',
            parent=otomobil_cat,
            sort_order=2
        )

        # 4. ÖZELLİKLER OLUŞTUR
        self.stdout.write('🏷️ Ürün özellikleri oluşturuluyor...')
        
        # Lastik ebadı
        ebat_attr = Attribute.objects.create(
            name='Ebat',
            attribute_type='text',
            is_required=True,
            sort_order=1
        )
        ebat_attr.categories.add(otomobil_cat, kamyon_cat)
        
        # Marka
        marka_attr = Attribute.objects.create(
            name='Marka',
            attribute_type='choice',
            choices='Pirelli\nMichelin\nBridgestone\nGoodyear\nContinental',
            is_required=True,
            sort_order=2
        )
        marka_attr.categories.add(otomobil_cat, kamyon_cat)
        
        # Hız indeksi
        hiz_attr = Attribute.objects.create(
            name='Hız İndeksi',
            attribute_type='choice',
            choices='H (210 km/h)\nV (240 km/h)\nW (270 km/h)\nY (300 km/h)',
            sort_order=3
        )
        hiz_attr.categories.add(otomobil_cat)
        
        # Yük indeksi
        yuk_attr = Attribute.objects.create(
            name='Yük İndeksi',
            attribute_type='number',
            unit='kg',
            is_required=True,
            sort_order=4
        )
        yuk_attr.categories.add(otomobil_cat, kamyon_cat)
        
        # Mevsim
        mevsim_attr = Attribute.objects.create(
            name='Mevsim',
            attribute_type='choice',
            choices='Yaz\nKış\n4 Mevsim',
            is_required=True,
            sort_order=5
        )
        mevsim_attr.categories.add(otomobil_cat)

        # 5. ÜRÜNLER OLUŞTUR
        self.stdout.write('🛞 Ürünler oluşturuluyor...')
        
        # Pirelli ürünü
        pirelli_urun = Product.objects.create(
            name='Pirelli P Zero',
            slug='pirelli-p-zero',
            description='Yüksek performanslı yaz lastiği',
            short_description='Spor araçlar için tasarlanmış premium lastik',
            category=yaz_lastigi,
            sku='PIR-PZERO-225-45-17',
            barcode='8019227308873',
            brand='Pirelli',
            model='P Zero',
            weight=Decimal('8.5'),
            is_active=True
        )
        
        # Michelin ürünü
        michelin_urun = Product.objects.create(
            name='Michelin Pilot Sport 4',
            slug='michelin-pilot-sport-4',
            description='Günlük kullanım için ideal spor lastik',
            category=yaz_lastigi,
            sku='MIC-PS4-225-45-17',
            barcode='3528708143456',
            brand='Michelin',
            model='Pilot Sport 4',
            weight=Decimal('8.3')
        )
        
        # Kış lastiği
        kis_urun = Product.objects.create(
            name='Continental WinterContact TS 860',
            slug='continental-wintercontact-ts-860',
            description='Güvenli kış sürüşü için optimize edilmiş',
            category=kis_lastigi,
            sku='CON-WC860-225-45-17',
            brand='Continental',
            model='WinterContact TS 860',
            weight=Decimal('8.7')
        )

        # 6. ÜRÜN ÖZELLİK DEĞERLERİ
        self.stdout.write('📝 Ürün özellik değerleri oluşturuluyor...')
        
        # Pirelli P Zero özellikleri
        ProductAttributeValue.objects.create(
            product=pirelli_urun,
            attribute=ebat_attr,
            value_text='225/45 R17'
        )
        ProductAttributeValue.objects.create(
            product=pirelli_urun,
            attribute=marka_attr,
            value_text='Pirelli'
        )
        ProductAttributeValue.objects.create(
            product=pirelli_urun,
            attribute=hiz_attr,
            value_text='Y (300 km/h)'
        )
        ProductAttributeValue.objects.create(
            product=pirelli_urun,
            attribute=yuk_attr,
            value_number=Decimal('875')
        )
        ProductAttributeValue.objects.create(
            product=pirelli_urun,
            attribute=mevsim_attr,
            value_text='Yaz'
        )
        
        # Michelin özellikleri
        ProductAttributeValue.objects.create(
            product=michelin_urun,
            attribute=ebat_attr,
            value_text='225/45 R17'
        )
        ProductAttributeValue.objects.create(
            product=michelin_urun,
            attribute=marka_attr,
            value_text='Michelin'
        )
        ProductAttributeValue.objects.create(
            product=michelin_urun,
            attribute=hiz_attr,
            value_text='W (270 km/h)'
        )
        ProductAttributeValue.objects.create(
            product=michelin_urun,
            attribute=yuk_attr,
            value_number=Decimal('875')
        )
        ProductAttributeValue.objects.create(
            product=michelin_urun,
            attribute=mevsim_attr,
            value_text='Yaz'
        )

        # 7. DEPOLAR OLUŞTUR
        self.stdout.write('🏢 Depolar oluşturuluyor...')
        
        # Toptancı A'nın Ankara deposu
        ankara_depo = Warehouse.objects.create(
            name='Ankara Ana Depo',
            code='ANK001',
            company=toptanci_a,
            address='Ostim OSB 1234. Sokak No:15',
            city='Ankara',
            postal_code='06370',
            phone='+90 312 385 45 67',
            manager_name='Ahmet Yılmaz',
            total_area=Decimal('2500.00'),
            storage_capacity=10000,
            warehouse_type='main',
            is_active=True
        )
        
        # Toptancı A'nın İstanbul deposu
        istanbul_depo = Warehouse.objects.create(
            name='İstanbul Dağıtım Merkezi',
            code='IST001',
            company=toptanci_a,
            address='Hadımköy Sanayi Sitesi',
            city='İstanbul',
            postal_code='34555',
            phone='+90 212 623 78 90',
            manager_name='Fatma Kaya',
            total_area=Decimal('1800.00'),
            storage_capacity=7500,
            warehouse_type='distribution'
        )
        
        # Perakendeci X'in deposu
        perakendeci_depo = Warehouse.objects.create(
            name='Levent Mağaza Deposu',
            code='LEV001',
            company=perakendeci_x,
            address='Levent Mahallesi 4. Levent',
            city='İstanbul',
            postal_code='34330',
            warehouse_type='retail',
            storage_capacity=500
        )

        # 8. STOK KALEMLERİ OLUŞTUR
        self.stdout.write('📦 Stok kalemleri oluşturuluyor...')
        
        # Pirelli - Ankara deposu (Görevde belirtilen)
        StockItem.objects.create(
            product=pirelli_urun,
            warehouse=ankara_depo,
            quantity=10,
            reserved_quantity=0,
            minimum_stock=5,
            maximum_stock=50,
            cost_price=Decimal('450.00'),
            sale_price=Decimal('650.00'),
            location_code='A1-B2',
            is_active=True,
            is_sellable=True
        )
        
        # Pirelli - İstanbul deposu
        StockItem.objects.create(
            product=pirelli_urun,
            warehouse=istanbul_depo,
            quantity=25,
            reserved_quantity=3,
            minimum_stock=10,
            maximum_stock=100,
            cost_price=Decimal('450.00'),
            sale_price=Decimal('650.00'),
            location_code='C3-D4'
        )
        
        # Michelin - Ankara deposu
        StockItem.objects.create(
            product=michelin_urun,
            warehouse=ankara_depo,
            quantity=15,
            minimum_stock=8,
            cost_price=Decimal('420.00'),
            sale_price=Decimal('620.00'),
            location_code='A2-B3'
        )
        
        # Michelin - İstanbul deposu
        StockItem.objects.create(
            product=michelin_urun,
            warehouse=istanbul_depo,
            quantity=30,
            reserved_quantity=5,
            minimum_stock=12,
            cost_price=Decimal('420.00'),
            sale_price=Decimal('620.00'),
            location_code='C1-D2'
        )
        
        # Continental kış lastiği - Ankara
        StockItem.objects.create(
            product=kis_urun,
            warehouse=ankara_depo,
            quantity=8,
            minimum_stock=3,
            cost_price=Decimal('380.00'),
            sale_price=Decimal('580.00'),
            location_code='B1-C1'
        )
        
        # Perakendeci X deposunda stok
        StockItem.objects.create(
            product=pirelli_urun,
            warehouse=perakendeci_depo,
            quantity=4,
            minimum_stock=2,
            maximum_stock=10,
            cost_price=Decimal('650.00'),  # Toptancıdan aldığı fiyat
            sale_price=Decimal('850.00'),  # Müşteriye satış fiyatı
            location_code='M1-A1'
        )

    def print_summary(self):
        """Oluşturulan verilerin özetini yazdır"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('📊 OLUŞTURULAN VERİLER ÖZETİ'))
        self.stdout.write('='*50)
        
        self.stdout.write(f'🏢 Şirketler: {Company.objects.count()}')
        self.stdout.write(f'   - Toptancılar: {Company.objects.filter(company_type__in=["wholesaler", "both"]).count()}')
        self.stdout.write(f'   - Perakendeciler: {Company.objects.filter(company_type__in=["retailer", "both"]).count()}')
        
        self.stdout.write(f'🔗 Şirket İlişkileri: {RetailerWholesaler.objects.count()}')
        
        self.stdout.write(f'📂 Kategoriler: {Category.objects.count()}')
        self.stdout.write(f'🏷️ Özellikler: {Attribute.objects.count()}')
        self.stdout.write(f'🛞 Ürünler: {Product.objects.count()}')
        self.stdout.write(f'📝 Ürün Özellik Değerleri: {ProductAttributeValue.objects.count()}')
        
        self.stdout.write(f'🏢 Depolar: {Warehouse.objects.count()}')
        self.stdout.write(f'📦 Stok Kalemleri: {StockItem.objects.count()}')
        
        total_stock_value = sum(
            (item.quantity * item.cost_price) if item.cost_price else 0 
            for item in StockItem.objects.all()
        )
        self.stdout.write(f'💰 Toplam Stok Değeri: ₺{total_stock_value:,.2f}')
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('🎯 DOĞRULAMA KONTROL LİSTESİ'))
        self.stdout.write('='*50)
        self.stdout.write('✅ Toptancı A oluşturuldu')
        self.stdout.write('✅ Perakendeci X oluşturuldu')
        self.stdout.write('✅ Perakendeci X - Toptancı A ilişkisi kuruldu')
        self.stdout.write('✅ Pirelli ürünü oluşturuldu')
        self.stdout.write('✅ Toptancı A\'nın Ankara deposu oluşturuldu')
        self.stdout.write('✅ Ankara deposunda Pirelli ürününden 10 adet stok oluşturuldu')
        self.stdout.write('\n✨ Admin panelinde tüm veriler görüntülenebilir!')
        self.stdout.write('🔗 http://localhost:8000/admin/')