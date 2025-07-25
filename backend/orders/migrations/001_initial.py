# backend/orders/migrations/0001_initial.py
# Generated migration file

from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import uuid
from decimal import Decimal


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('companies', '0001_initial'),
        ('products', '0001_initial'),
        ('inventory', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order_number', models.CharField(help_text='Benzersiz sipariş numarası', max_length=50, unique=True, verbose_name='Sipariş Numarası')),
                ('uuid', models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name='UUID')),
                ('status', models.CharField(choices=[('draft', 'Taslak'), ('pending', 'Beklemede'), ('confirmed', 'Onaylandı'), ('processing', 'İşleniyor'), ('shipped', 'Kargoya Verildi'), ('delivered', 'Teslim Edildi'), ('canceled', 'İptal Edildi'), ('rejected', 'Reddedildi')], default='draft', max_length=20, verbose_name='Sipariş Durumu')),
                ('payment_status', models.CharField(choices=[('pending', 'Ödeme Bekliyor'), ('paid', 'Ödendi'), ('partially_paid', 'Kısmi Ödendi'), ('failed', 'Ödeme Başarısız'), ('refunded', 'İade Edildi')], default='pending', max_length=20, verbose_name='Ödeme Durumu')),
                ('subtotal', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.00'))], verbose_name='Ara Toplam')),
                ('tax_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.00'))], verbose_name='KDV Tutarı')),
                ('shipping_cost', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.00'))], verbose_name='Kargo Ücreti')),
                ('discount_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.00'))], verbose_name='İndirim Tutarı')),
                ('total_amount', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.00'))], verbose_name='Toplam Tutar')),
                ('currency', models.CharField(default='TRY', max_length=3, verbose_name='Para Birimi')),
                ('tyrex_commission_rate', models.DecimalField(decimal_places=2, default=Decimal('2.50'), help_text='Sipariş anındaki komisyon oranı', max_digits=5, verbose_name='Tyrex Komisyon Oranı (%)')),
                ('tyrex_commission_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12, verbose_name='Tyrex Komisyon Tutarı')),
                ('delivery_address', models.TextField(blank=True, null=True, verbose_name='Teslimat Adresi')),
                ('delivery_contact', models.CharField(blank=True, max_length=200, null=True, verbose_name='Teslimat İletişim')),
                ('delivery_phone', models.CharField(blank=True, max_length=20, null=True, verbose_name='Teslimat Telefonu')),
                ('payment_terms_days', models.PositiveIntegerField(default=30, verbose_name='Ödeme Vadesi (Gün)')),
                ('due_date', models.DateTimeField(blank=True, null=True, verbose_name='Ödeme Vadesi')),
                ('notes', models.TextField(blank=True, null=True, verbose_name='Sipariş Notları')),
                ('internal_notes', models.TextField(blank=True, help_text='Sadece sistem kullanıcıları tarafından görülür', null=True, verbose_name='İç Notlar')),
                ('order_date', models.DateTimeField(auto_now_add=True, verbose_name='Sipariş Tarihi')),
                ('confirmed_at', models.DateTimeField(blank=True, null=True, verbose_name='Onay Tarihi')),
                ('shipped_at', models.DateTimeField(blank=True, null=True, verbose_name='Kargo Tarihi')),
                ('delivered_at', models.DateTimeField(blank=True, null=True, verbose_name='Teslimat Tarihi')),
                ('canceled_at', models.DateTimeField(blank=True, null=True, verbose_name='İptal Tarihi')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Oluşturulma Tarihi')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Güncellenme Tarihi')),
                ('retailer', models.ForeignKey(limit_choices_to={'company_type__in': ['retailer', 'both']}, on_delete=django.db.models.deletion.CASCADE, related_name='orders_placed', to='companies.company', verbose_name='Perakendeci')),
                ('retailer_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders', to=settings.AUTH_USER_MODEL, verbose_name='Sipariş Veren Kullanıcı')),
                ('wholesaler', models.ForeignKey(limit_choices_to={'company_type__in': ['wholesaler', 'both']}, on_delete=django.db.models.deletion.CASCADE, related_name='orders_received', to='companies.company', verbose_name='Toptancı')),
            ],
            options={
                'verbose_name': 'Sipariş',
                'verbose_name_plural': 'Siparişler',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='OrderStatusHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('old_status', models.CharField(blank=True, choices=[('draft', 'Taslak'), ('pending', 'Beklemede'), ('confirmed', 'Onaylandı'), ('processing', 'İşleniyor'), ('shipped', 'Kargoya Verildi'), ('delivered', 'Teslim Edildi'), ('canceled', 'İptal Edildi'), ('rejected', 'Reddedildi')], max_length=20, null=True, verbose_name='Eski Durum')),
                ('new_status', models.CharField(choices=[('draft', 'Taslak'), ('pending', 'Beklemede'), ('confirmed', 'Onaylandı'), ('processing', 'İşleniyor'), ('shipped', 'Kargoya Verildi'), ('delivered', 'Teslim Edildi'), ('canceled', 'İptal Edildi'), ('rejected', 'Reddedildi')], max_length=20, verbose_name='Yeni Durum')),
                ('change_reason', models.CharField(blank=True, max_length=200, null=True, verbose_name='Değişiklik Nedeni')),
                ('notes', models.TextField(blank=True, null=True, verbose_name='Notlar')),
                ('changed_at', models.DateTimeField(auto_now_add=True, verbose_name='Değişiklik Tarihi')),
                ('changed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='Değiştiren Kullanıcı')),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='status_history', to='orders.order', verbose_name='Sipariş')),
            ],
            options={
                'verbose_name': 'Sipariş Durum Geçmişi',
                'verbose_name_plural': 'Sipariş Durum Geçmişleri',
                'ordering': ['-changed_at'],
            },
        ),
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)], verbose_name='Miktar')),
                ('unit_price', models.DecimalField(decimal_places=4, help_text='Perakendeciye satılan fiyat (dinamik hesaplanmış)', max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.0001'))], verbose_name='Birim Fiyat (Satış)')),
                ('wholesaler_reference_price', models.DecimalField(decimal_places=4, help_text='Toptancının orijinal liste fiyatı (analiz için)', max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.0001'))], verbose_name='Toptancı Liste Fiyatı')),
                ('total_price', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))], verbose_name='Toplam Fiyat')),
                ('discount_percentage', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=5, validators=[django.core.validators.MinValueValidator(Decimal('0.00'))], verbose_name='İndirim Yüzdesi')),
                ('discount_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.00'))], verbose_name='İndirim Tutarı')),
                ('product_name', models.CharField(help_text='Sipariş anındaki ürün adı', max_length=200, verbose_name='Ürün Adı (Anlık)')),
                ('product_sku', models.CharField(help_text='Sipariş anındaki ürün kodu', max_length=100, verbose_name='Ürün Kodu (Anlık)')),
                ('product_brand', models.CharField(blank=True, max_length=100, null=True, verbose_name='Marka (Anlık)')),
                ('is_canceled', models.BooleanField(default=False, verbose_name='İptal Edildi')),
                ('canceled_at', models.DateTimeField(blank=True, null=True, verbose_name='İptal Tarihi')),
                ('cancel_reason', models.CharField(blank=True, max_length=200, null=True, verbose_name='İptal Nedeni')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Oluşturulma Tarihi')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Güncellenme Tarihi')),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='orders.order', verbose_name='Sipariş')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='order_items', to='products.product', verbose_name='Ürün')),
                ('stock_item', models.ForeignKey(help_text='Referans stok kalemi', on_delete=django.db.models.deletion.CASCADE, related_name='order_items', to='inventory.stockitem', verbose_name='Stok Kalemi')),
                ('warehouse', models.ForeignKey(help_text='Ürünün alındığı depo', on_delete=django.db.models.deletion.CASCADE, related_name='order_items', to='inventory.warehouse', verbose_name='Kaynak Depo')),
            ],
            options={
                'verbose_name': 'Sipariş Kalemi',
                'verbose_name_plural': 'Sipariş Kalemleri',
                'ordering': ['order', 'product__name'],
            },
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['order_number'], name='orders_orde_order_n_87e0c5_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['retailer', 'status'], name='orders_orde_retaile_a55fb3_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['wholesaler', 'status'], name='orders_orde_wholesa_9a53ce_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['order_date'], name='orders_orde_order_d_8ae8db_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['status', 'payment_status'], name='orders_orde_status_58da52_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='orderitem',
            unique_together={('order', 'product', 'warehouse')},
        ),
        migrations.AddIndex(
            model_name='orderitem',
            index=models.Index(fields=['order', 'product'], name='orders_orde_order_i_bc5de3_idx'),
        ),
        migrations.AddIndex(
            model_name='orderitem',
            index=models.Index(fields=['product', 'quantity'], name='orders_orde_product_8a4b94_idx'),
        ),
    ]