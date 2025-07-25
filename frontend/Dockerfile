# Temel imaj olarak Node.js'in resmi imajını kullan
FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Package files'ları kopyala
COPY package*.json ./

# Dependencies'leri kur
RUN npm ci --only=production

# Proje dosyalarını kopyala
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js build
RUN npm run build

# Port'u dışarıya aç
EXPOSE 3000

# Uygulamayı başlat
CMD ["npm", "start"]