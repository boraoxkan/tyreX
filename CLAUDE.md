# Tyrex Projesi Kılavuzu (AI Agent'lar için)

Bu dosya, Tyrex projesi üzerinde çalışan tüm AI subagent'ları için ana referans kaynağıdır. Lütfen herhangi bir kod yazmadan veya komut çalıştırmadan önce buradaki kuralları ve bilgileri dikkate al.

## 1. Proje Özeti

- **Proje Adı:** Tyrex
- **Amacı:** Lastik üreticileri, distribütörleri ve alıcıları için bir B2B (Business-to-Business) Pazaryeri platformu.
- **Mimari:** Monorepo yapısında, birbirinden ayrı çalışan bir Django (Backend) ve Next.js (Frontend) uygulamasından oluşur.

## 2. Teknoloji Stack'i

- **Backend:**
  - **Framework:** Django & Django REST Framework (DRF)
  - **Dil:** Python
  - **Veritabanı:** PostgreSQL
  - **Asenkron Görevler:** Celery & Redis
  - **Kimlik Doğrulama:** JWT (JSON Web Token)
- **Frontend:**
  - **Framework:** Next.js
  - **Dil:** TypeScript
  - **UI:** React
  - **Styling:** Tailwind CSS
  - **State Management:** Zustand
- **Altyapı:** Docker & Docker Compose

## 3. Proje Mimarisi ve Dizin Yapısı

- **`backend/`**: Tüm Django kodunu içerir.
  - Django app'leri (`users`, `products`, `orders` vb.) modülerdir.
  - Modeller `models.py`, API logiği `views.py` ve `serializers.py` dosyalarındadır.
- **`frontend/`**: Tüm Next.js kodunu içerir.
  - Sayfalar `src/pages/` altındadır.
  - Tekrar kullanılabilir component'ler `src/components/` altındadır.
  - Global state `src/store/` (Zustand) ile yönetilir.
- **`docker-compose.yml`**: Projenin tüm servislerini (backend, frontend, db, redis) tanımlar.

## 4. Temel Komutlar ve İş Akışları

- **Projeyi Başlatma:**
  ```bash
  docker compose up -d

- **Veritabanı Migration:**
  ```bash
  docker compose exec backend python manage.py makemigrations
  docker compose exec backend python manage.py migrate

- **API Testlerini Çalıştırma:**
  ```bash
  docker compose exec backend newman run Tyrex.postman_collection.json

- **Backend İçinde Komut Çalıştırma:**
  ```bash
  docker compose exec backend <command>

## 5. Kodlama Standartları ve Kurallar

- **Backend Kuralları:**
  CRUD işlemleri için daima ModelViewSet kullan.
  
  Karmaşık business logiğini views.py yerine models.py içindeki metodlara veya ayrı servis dosyalarına yaz.

  Tüm hassas veriler (Secret Key, DB şifresi vb.) environment değişkenleri ile yönetilmelidir. Asla koda hard-code yazma.

  N+1 query probleminden kaçınmak için select_related ve prefetch_related kullanmaya özen göster.

- **Frontend Kuralları:**
  Stil için sadece Tailwind CSS utility class'larını kullan. globals.css dışındaki CSS dosyalarına dokunma.

  Tüm component'ler ve fonksiyonlar için TypeScript tiplerini kullan. any tipinden kaçın.

  Uygulama genelinde paylaşılması gereken state (kullanıcı bilgisi, sepet vb.) için src/store/authStore.ts veya cartStore.ts gibi Zustand store'larını kullan.

  Backend API'sine istekler src/lib/api.ts içindeki axios instance'ı üzerinden yapılmalıdır.

- **API URL:**
  Docker network'ü içinde backend servisine http://backend:8000 adresinden erişilir. Frontend'den yapılacak tüm API çağrıları bu adresi hedeflemelidir.