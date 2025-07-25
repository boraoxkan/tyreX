# backend/core/__init__.py
# Celery app'in Django ile beraber çalışması için
from .celery import app as celery_app

__all__ = ('celery_app',)