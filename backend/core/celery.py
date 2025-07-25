# backend/core/celery.py
import os
from celery import Celery

# Django ayarlarını belirle
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('tyrex_backend')

# Django ayarlarından Celery konfigürasyonunu yükle
app.config_from_object('django.conf:settings', namespace='CELERY')

# Otomatik olarak görevleri keşfet
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')