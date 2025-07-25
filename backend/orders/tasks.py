# backend/orders/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_order_to_wholesaler(self, order_id):
    """
    Toptancıya sipariş bildirimi gönderen Celery görevi
    """
    try:
        from .models import Order, OrderStatusHistory
        
        # Siparişi al
        try:
            order = Order.objects.select_related(
                'retailer', 'wholesaler', 'retailer_user'
            ).prefetch_related('items__product').get(id=order_id)
        except Order.DoesNotExist:
            logger.error(f"Order {order_id} not found")
            return {
                'success': False,
                'error': f'Sipariş ID {order_id} bulunamadı'
            }
        
        # Sipariş detaylarını hazırla
        order_details = {
            'order_number': order.order_number,
            'retailer_name': order.retailer.name,
            'retailer_email': order.retailer.email,
            'retailer_phone': order.retailer.phone,
            'retailer_user': f"{order.retailer_user.first_name} {order.retailer_user.last_name}",
            'total_amount': str(order.total_amount),
            'currency': order.currency,
            'order_date': order.order_date.strftime('%d.%m.%Y %H:%M'),
            'payment_terms_days': order.payment_terms_days,
            'delivery_address': order.delivery_address,
            'delivery_contact': order.delivery_contact,
            'delivery_phone': order.delivery_phone,
            'notes': order.notes,
            'items': []
        }
        
        # Sipariş kalemlerini ekle
        for item in order.items.all():
            order_details['items'].append({
                'product_name': item.product_name,
                'product_sku': item.product_sku,
                'product_brand': item.product_brand,
                'quantity': item.quantity,
                'unit_price': str(item.unit_price),
                'total_price': str(item.total_price),
                'warehouse_name': item.warehouse.name
            })
        
        # 1. Email bildirimi gönder
        email_result = send_order_email_notification(order, order_details)
        
        # 2. API bildirimi gönder (toptancının kendi sistemine)
        api_result = send_order_api_notification(order, order_details)
        
        # 3. SMS bildirimi gönder (opsiyonel)
        sms_result = send_order_sms_notification(order, order_details)
        
        # Sonuçları logla
        logger.info(f"Order {order.order_number} notification sent:")
        logger.info(f"  Email: {email_result['success']}")
        logger.info(f"  API: {api_result['success']}")
        logger.info(f"  SMS: {sms_result['success']}")
        
        # Sipariş durumu güncelle (API başarılıysa)
        if api_result['success']:
            order.status = 'confirmed'
            order.confirmed_at = timezone.now()
            order.save(update_fields=['status', 'confirmed_at'])
            
            # Durum geçmişi kaydet
            OrderStatusHistory.objects.create(
                order=order,
                old_status='pending',
                new_status='confirmed',
                change_reason='Toptancıya başarıyla iletildi',
                notes=f'Email: {email_result["success"]}, API: {api_result["success"]}, SMS: {sms_result["success"]}'
            )
        
        return {
            'success': True,
            'order_number': order.order_number,
            'notifications': {
                'email': email_result,
                'api': api_result,
                'sms': sms_result
            }
        }
        
    except Exception as exc:
        logger.error(f"Order notification task failed: {str(exc)}")
        
        # Retry mekanizması
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying order notification (attempt {self.request.retries + 1})")
            raise self.retry(countdown=60 * (2 ** self.request.retries))
        
        # Max retry'a ulaştıysa sipariş durumunu güncelle
        try:
            order = Order.objects.get(id=order_id)
            order.internal_notes = f"Toptancı bildirimi başarısız: {str(exc)}"
            order.save(update_fields=['internal_notes'])
            
            OrderStatusHistory.objects.create(
                order=order,
                old_status='pending',
                new_status='pending',
                change_reason='Toptancı bildirimi başarısız',
                notes=str(exc)
            )
        except:
            pass
        
        return {
            'success': False,
            'error': str(exc),
            'retries': self.request.retries
        }


def send_order_email_notification(order, order_details):
    """
    Email bildirimi gönder
    """
    try:
        # Email şablonunu hazırla
        subject = f"Yeni Sipariş: {order.order_number} - {order.retailer.name}"
        
        # HTML email içeriği
        html_message = f"""
        <html>
        <body>
            <h2>Yeni Sipariş Bildirimi</h2>
            
            <h3>Sipariş Bilgileri</h3>
            <ul>
                <li><strong>Sipariş No:</strong> {order_details['order_number']}</li>
                <li><strong>Tarih:</strong> {order_details['order_date']}</li>
                <li><strong>Toplam:</strong> {order_details['total_amount']} {order_details['currency']}</li>
                <li><strong>Ödeme Vadesi:</strong> {order_details['payment_terms_days']} gün</li>
            </ul>
            
            <h3>Perakendeci Bilgileri</h3>
            <ul>
                <li><strong>Şirket:</strong> {order_details['retailer_name']}</li>
                <li><strong>Email:</strong> {order_details['retailer_email']}</li>
                <li><strong>Telefon:</strong> {order_details['retailer_phone']}</li>
                <li><strong>Sipariş Veren:</strong> {order_details['retailer_user']}</li>
            </ul>
            
            <h3>Teslimat Bilgileri</h3>
            <ul>
                <li><strong>Adres:</strong> {order_details['delivery_address']}</li>
                <li><strong>İletişim:</strong> {order_details['delivery_contact']}</li>
                <li><strong>Telefon:</strong> {order_details['delivery_phone']}</li>
            </ul>
            
            <h3>Sipariş Kalemleri</h3>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr>
                    <th>Ürün</th>
                    <th>SKU</th>
                    <th>Marka</th>
                    <th>Miktar</th>
                    <th>Birim Fiyat</th>
                    <th>Toplam</th>
                    <th>Depo</th>
                </tr>
        """
        
        for item in order_details['items']:
            html_message += f"""
                <tr>
                    <td>{item['product_name']}</td>
                    <td>{item['product_sku']}</td>
                    <td>{item['product_brand']}</td>
                    <td>{item['quantity']}</td>
                    <td>{item['unit_price']} TRY</td>
                    <td>{item['total_price']} TRY</td>
                    <td>{item['warehouse_name']}</td>
                </tr>
            """
        
        html_message += f"""
            </table>
            
            <h3>Notlar</h3>
            <p>{order_details['notes'] or 'Not yok'}</p>
            
            <hr>
            <p><small>Bu email Tyrex B2B Pazaryeri sistemi tarafından otomatik olarak gönderilmiştir.</small></p>
        </body>
        </html>
        """
        
        # Email gönder
        send_mail(
            subject=subject,
            message=f"Yeni sipariş: {order.order_number}",  # Plain text fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.wholesaler.email],
            html_message=html_message,
            fail_silently=False
        )
        
        return {
            'success': True,
            'method': 'email',
            'recipient': order.wholesaler.email
        }
        
    except Exception as e:
        logger.error(f"Email notification failed: {str(e)}")
        return {
            'success': False,
            'method': 'email',
            'error': str(e)
        }


def send_order_api_notification(order, order_details):
    """
    Toptancının API'sine sipariş bildirimi gönder
    """
    try:
        import requests
        import json
        
        # Toptancının API endpoint'ini al (şimdilik mock)
        # Gerçek uygulamada bu bilgi Company modelinde tutulabilir
        api_endpoint = f"https://api.{order.wholesaler.name.lower().replace(' ', '')}.com/orders/incoming"
        
        # API payload'ı hazırla
        payload = {
            'source': 'tyrex_b2b',
            'source_order_id': order.id,
            'order_number': order_details['order_number'],
            'retailer': {
                'name': order_details['retailer_name'],
                'email': order_details['retailer_email'],
                'phone': order_details['retailer_phone'],
                'contact_person': order_details['retailer_user']
            },
            'order_info': {
                'total_amount': order_details['total_amount'],
                'currency': order_details['currency'],
                'payment_terms_days': order_details['payment_terms_days'],
                'order_date': order_details['order_date'],
                'notes': order_details['notes']
            },
            'delivery': {
                'address': order_details['delivery_address'],
                'contact': order_details['delivery_contact'],
                'phone': order_details['delivery_phone']
            },
            'items': order_details['items']
        }
        
        # API çağrısı yap
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {get_wholesaler_api_token(order.wholesaler)}',
            'User-Agent': 'Tyrex-B2B/1.0'
        }
        
        # Şimdilik mock response (gerçek API çağrısı devre dışı)
        mock_api_call = True
        
        if mock_api_call:
            # Simüle edilmiş başarılı response
            response_data = {
                'success': True,
                'wholesaler_order_id': f"WHL-{order.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                'estimated_processing_time': '2-3 iş günü',
                'contact_person': 'Satış Departmanı',
                'message': 'Sipariş başarıyla alındı ve işleme alınacak'
            }
            
            return {
                'success': True,
                'method': 'api',
                'endpoint': api_endpoint,
                'response': response_data
            }
        else:
            # Gerçek API çağrısı
            response = requests.post(
                api_endpoint,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'method': 'api',
                    'endpoint': api_endpoint,
                    'response': response.json()
                }
            else:
                raise Exception(f"API Error {response.status_code}: {response.text}")
        
    except Exception as e:
        logger.error(f"API notification failed: {str(e)}")
        return {
            'success': False,
            'method': 'api',
            'error': str(e)
        }


def send_order_sms_notification(order, order_details):
    """
    SMS bildirimi gönder
    """
    try:
        # SMS servis sağlayıcısına göre implementasyon
        # Şimdilik mock implementation
        
        if not order.wholesaler.phone:
            return {
                'success': False,
                'method': 'sms',
                'error': 'Toptancı telefon numarası bulunamadı'
            }
        
        message = f"""
TYREX B2B - Yeni Sipariş
Sipariş No: {order_details['order_number']}
Perakendeci: {order_details['retailer_name']}
Toplam: {order_details['total_amount']} {order_details['currency']}
Detaylar için email'inizi kontrol edin.
        """.strip()
        
        # Mock SMS gönderimi
        logger.info(f"SMS would be sent to {order.wholesaler.phone}: {message}")
        
        return {
            'success': True,
            'method': 'sms',
            'recipient': order.wholesaler.phone,
            'message_length': len(message)
        }
        
    except Exception as e:
        logger.error(f"SMS notification failed: {str(e)}")
        return {
            'success': False,
            'method': 'sms',
            'error': str(e)
        }


def get_wholesaler_api_token(wholesaler):
    """
    Toptancı için API token'ı al
    Gerçek uygulamada bu bilgi güvenli bir şekilde saklanmalı
    """
    # Mock token
    return f"tyrex_token_{wholesaler.id}_mock"


@shared_task
def update_order_status_batch():
    """
    Toplu sipariş durumu güncelleme görevi
    Günlük çalıştırılabilir (Celery Beat ile)
    """
    try:
        from .models import Order
        from datetime import timedelta
        
        # Uzun süredir bekleyen siparişleri bul
        cutoff_date = timezone.now() - timedelta(days=7)
        
        pending_orders = Order.objects.filter(
            status='pending',
            order_date__lt=cutoff_date
        )
        
        updated_count = 0
        for order in pending_orders:
            order.internal_notes = f"7 günden uzun süredir bekleyen sipariş. Otomatik kontrol gerekli."
            order.save(update_fields=['internal_notes'])
            updated_count += 1
        
        logger.info(f"Batch status update completed: {updated_count} orders flagged")
        
        return {
            'success': True,
            'updated_orders': updated_count
        }
        
    except Exception as e:
        logger.error(f"Batch status update failed: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }