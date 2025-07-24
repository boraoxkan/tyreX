import os
from pathlib import Path
import dotenv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# .env dosyasını yükle
dotenv.load_dotenv(os.path.join(BASE_DIR, ".env"))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

SECRET_KEY = os.environ.get("SECRET_KEY")
DEBUG = os.environ.get("DEBUG", "False").lower() in ("true", "1", "t")

ALLOWED_HOSTS = ["*"] # Geliştirme için, production'da spesifik domain'ler olmalı.


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Üçüncü Parti Uygulamalar
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'debug_toolbar',

    # Kendi Uygulamalarımız
    'users',
    'companies',  # YENİ EKLENDİ
    'products',   # YENİ EKLENDİ
    'inventory',  # YENİ EKLENDİ
    'subscriptions',  # YENİ EKLENDİ
    'market',         # YENİ EKLENDİ
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    # CORS Middleware'i, yanıtları işleyebilmesi için SessionMiddleware'den sonra, CommonMiddleware'den önce gelmelidir.
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Debug Toolbar Middleware'i en sona eklenmelidir.
    "debug_toolbar.middleware.DebugToolbarMiddleware",
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
DATABASES = {
    'default': dj_database_url.config(default=os.environ.get("DATABASE_URL"))
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/
LANGUAGE_CODE = 'tr-tr'
TIME_ZONE = 'Europe/Istanbul'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/
STATIC_URL = 'static/'


# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- ÖZEL AYARLAR ---

# Özel Kullanıcı Modelini Tanımla
AUTH_USER_MODEL = 'users.User'

# Django REST Framework Ayarları
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',  # Anonim kullanıcılar için günde 100 istek
        'user': '1000/day' # Kayıtlı kullanıcılar için günde 1000 istek
    }
}

# CORS (Cross-Origin Resource Sharing) Ayarları
# Geliştirme ortamında tüm kaynaklara izin ver. Production'da bunu kısıtla!
CORS_ALLOW_ALL_ORIGINS = True
# VEYA daha güvenli bir yöntem:
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
# ]


# CACHE ayarlarını güncelleyin (Redis settings zaten var):
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
        "KEY_PREFIX": "tyrex",  # Prefix ekleyin
        "TIMEOUT": 300,  # Varsayılan 5 dakika
    }
}

# Celery Ayarları
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND_URL")

# Debug Toolbar Ayarları (Docker içinden erişim için)
INTERNAL_IPS = [
    "127.0.0.1",
]

# JWT Ayarları (backend/core/settings.py dosyasının sonuna ekleyin)
from datetime import timedelta

# Simple JWT Ayarları
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),  # Access token 1 saat geçerli
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),  # Refresh token 1 hafta geçerli
    'ROTATE_REFRESH_TOKENS': True,  # Refresh token yenilendiğinde eski geçersiz olur
    'BLACKLIST_AFTER_ROTATION': True,  # Eski refresh token'ları blacklist'e ekle
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(hours=1),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=7),
}

if DEBUG:
    # Debug toolbar panels
    DEBUG_TOOLBAR_PANELS = [
        'debug_toolbar.panels.history.HistoryPanel',
        'debug_toolbar.panels.versions.VersionsPanel',
        'debug_toolbar.panels.timer.TimerPanel',
        'debug_toolbar.panels.settings.SettingsPanel',
        'debug_toolbar.panels.headers.HeadersPanel',
        'debug_toolbar.panels.request.RequestPanel',
        'debug_toolbar.panels.sql.SQLPanel',
        'debug_toolbar.panels.staticfiles.StaticFilesPanel',
        'debug_toolbar.panels.templates.TemplatesPanel',
        'debug_toolbar.panels.cache.CachePanel',
        'debug_toolbar.panels.signals.SignalsPanel',
        'debug_toolbar.panels.logging.LoggingPanel',
        'debug_toolbar.panels.redirects.RedirectsPanel',
        'debug_toolbar.panels.profiling.ProfilingPanel',
    ]
    
    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TOOLBAR_CALLBACK': lambda request: True,  # Her zaman göster
    }

# Logging configuration (isteğe bağlı):
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}