# Generated by Django 5.2.4 on 2025-07-24 16:55

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Company',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='Şirket Adı')),
                ('company_type', models.CharField(choices=[('retailer', 'Perakendeci'), ('wholesaler', 'Toptancı'), ('both', 'Hem Perakendeci Hem Toptancı')], max_length=20, verbose_name='Şirket Türü')),
                ('is_managed_by_tyrex', models.BooleanField(default=False, help_text='Bu şirket Tyrex platformu üzerinden yönetiliyor mu?', verbose_name='Tyrex Tarafından Yönetiliyor mu?')),
                ('email', models.EmailField(blank=True, max_length=254, null=True, verbose_name='E-posta')),
                ('phone', models.CharField(blank=True, max_length=20, null=True, verbose_name='Telefon')),
                ('address', models.TextField(blank=True, null=True, verbose_name='Adres')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Oluşturulma Tarihi')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Güncellenme Tarihi')),
                ('is_active', models.BooleanField(default=True, verbose_name='Aktif')),
            ],
            options={
                'verbose_name': 'Şirket',
                'verbose_name_plural': 'Şirketler',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='RetailerWholesaler',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_date', models.DateField(auto_now_add=True, verbose_name='İlişki Başlangıç Tarihi')),
                ('is_active', models.BooleanField(default=True, verbose_name='Aktif İlişki')),
                ('notes', models.TextField(blank=True, null=True, verbose_name='Notlar')),
                ('credit_limit', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name='Kredi Limiti')),
                ('payment_terms_days', models.PositiveIntegerField(default=30, verbose_name='Ödeme Vadesi (Gün)')),
                ('retailer', models.ForeignKey(limit_choices_to={'company_type__in': ['retailer', 'both']}, on_delete=django.db.models.deletion.CASCADE, related_name='wholesaler_relationships', to='companies.company', verbose_name='Perakendeci')),
                ('wholesaler', models.ForeignKey(limit_choices_to={'company_type__in': ['wholesaler', 'both']}, on_delete=django.db.models.deletion.CASCADE, related_name='retailer_relationships', to='companies.company', verbose_name='Toptancı')),
            ],
            options={
                'verbose_name': 'Perakendeci-Toptancı İlişkisi',
                'verbose_name_plural': 'Perakendeci-Toptancı İlişkileri',
                'ordering': ['retailer__name', 'wholesaler__name'],
                'unique_together': {('retailer', 'wholesaler')},
            },
        ),
    ]
