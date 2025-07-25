'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap, 
  Globe,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: ShoppingCart,
      title: 'B2B Pazaryeri',
      description: 'Binlerce lastik çeşidine anında erişim ve karşılaştırma imkanı.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: TrendingUp,
      title: 'Dinamik Fiyatlandırma',
      description: 'Toptancı ilişkinize özel hesaplanan indirimli fiyatlar.',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Zap,
      title: 'Hızlı Sipariş',
      description: '3 tıkla sipariş, otomatik faturalama ve kargo takibi.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Tyrex B2B</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-500 hover:text-gray-900">
                Giriş Yap
              </Link>
              <Link href="/auth/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Kayıt Ol
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              B2B Lastik
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Pazaryeri
              </span>
            </h1>
            <p className="text-xl lg:text-2xl opacity-90 mb-8 leading-relaxed max-w-3xl mx-auto">
              Türkiye&apos;nin en büyük lastik pazaryerine hoş geldiniz. 
              Dinamik fiyatlandırma, hızlı sipariş ve güvenli ödeme ile 
              işinizi büyütün.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                7 Gün Ücretsiz Dene
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/auth/login" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors">
                Giriş Yap
              </Link>
            </div>
            <p className="mt-4 text-sm opacity-75">
              ✓ Kredi kartı gerekmez • ✓ Anında başlayın • ✓ İstediğiniz zaman iptal edin
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Neden Tyrex B2B?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Modern teknoloji ile lastik ticaretini kolaylaştırıyoruz. 
              İşinizi büyütmeniz için ihtiyacınız olan her şey burada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-6 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all group">
                  <div className={`p-3 rounded-lg ${feature.bgColor} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Hemen Başlayın
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            7 günlük ücretsiz deneme ile Tyrex B2B&apos;nin tüm özelliklerini keşfedin. 
            Kredi kartı gerekmez, istediğiniz zaman iptal edebilirsiniz.
          </p>
          <Link href="/auth/register" className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Ücretsiz Hesap Oluştur
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold">Tyrex B2B</span>
            </div>
            <p className="text-gray-400">
              © 2024 Tyrex B2B. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}