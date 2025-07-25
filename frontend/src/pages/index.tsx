import React from 'react';
import Head from 'next/head';
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
import Layout from '@/components/layout/Layout';

const HomePage: React.FC = () => {
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
    {
      icon: Users,
      title: 'Çoklu Toptancı',
      description: 'Birden fazla toptancı ile çalışın, en iyi fiyatları karşılaştırın.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: Shield,
      title: 'Güvenli Ödeme',
      description: 'SSL sertifikalı güvenli ödeme altyapısı ve vade seçenekleri.',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      icon: Globe,
      title: 'Türkiye Geneli',
      description: 'Tüm Türkiye\'ye hızlı teslimat ve kargo entegrasyonu.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  const testimonials = [
    {
      name: 'Ahmet Yılmaz',
      company: 'Premium Lastik Mağazası',
      content: 'Tyrex sayesinde toptancılarımla daha verimli çalışıyorum. Dinamik fiyatlandırma özelliği müthiş!',
      rating: 5,
    },
    {
      name: 'Mehmet Özkan',
      company: 'Hızlı Lastik Zinciri',
      content: 'Sipariş sürecim 10 dakikadan 2 dakikaya düştü. Pazaryerinde her şey bir arada.',
      rating: 5,
    },
    {
      name: 'Ali Kaya',
      company: 'Mega Lastik Market',
      content: 'Çoklu toptancı özelliği sayesinde maliyetlerimizi %15 düşürdük.',
      rating: 5,
    },
  ];

  const plans = [
    {
      name: 'Ücretsiz',
      price: '₺0',
      period: '/ay',
      description: 'Başlangıç için ideal',
      features: [
        '1 Kullanıcı',
        '1 Depo',
        '50 Ürün',
        'Temel Raporlar',
      ],
      cta: 'Ücretsiz Başla',
      popular: false,
    },
    {
      name: 'Temel',
      price: '₺299',
      period: '/ay',
      description: 'Küçük işletmeler için',
      features: [
        '3 Kullanıcı',
        '2 Depo',
        '500 Ürün',
        'Pazaryeri Erişimi',
        'Dinamik Fiyatlandırma',
        'E-posta Desteği',
      ],
      cta: '7 Gün Ücretsiz Dene',
      popular: true,
    },
    {
      name: 'Premium',
      price: '₺599',
      period: '/ay',
      description: 'Büyüyen işletmeler için',
      features: [
        '10 Kullanıcı',
        '5 Depo',
        '2.000 Ürün',
        'Gelişmiş Analitik',
        'Öncelikli Destek',
        'API Erişimi',
      ],
      cta: '7 Gün Ücretsiz Dene',
      popular: false,
    },
  ];

  return (
    <>
      <Head>
        <title>Tyrex B2B - Türkiye&apos;nin En Büyük Lastik Pazaryeri</title>
        <meta name="description" content="B2B lastik pazaryerinde binlerce ürün, dinamik fiyatlandırma ve hızlı teslimat. Perakendeciler için özel çözümler." />
        <meta name="keywords" content="lastik, b2b, pazaryeri, toptancı, perakendeci, tire marketplace" />
      </Head>

      <Layout showSidebar={false}>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
          <div className="container-page py-20 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                  B2B Lastik
                  <span className="block text-gradient bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Pazaryeri
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl opacity-90 mb-8 leading-relaxed">
                  Türkiye&apos;nin en büyük lastik pazaryerine hoş geldiniz. 
                  Dinamik fiyatlandırma, hızlı sipariş ve güvenli ödeme ile 
                  işinizi büyütün.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/register" className="btn btn-lg bg-white text-primary-600 hover:bg-gray-50 px-8 py-4">
                    7 Gün Ücretsiz Dene
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link href="/auth/login" className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4">
                    Giriş Yap
                  </Link>
                </div>
                <p className="mt-4 text-sm opacity-75">
                  ✓ Kredi kartı gerekmez • ✓ Anında başlayın • ✓ İstediğiniz zaman iptal edin
                </p>
              </div>

              <div className="relative">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/20 rounded-lg">
                      <span className="font-medium">Michelin Pilot Sport 4</span>
                      <span className="text-green-300 font-bold">₺850</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/20 rounded-lg">
                      <span className="font-medium">Pirelli P Zero</span>
                      <span className="text-green-300 font-bold">₺920</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/20 rounded-lg">
                      <span className="font-medium">Continental SportContact</span>
                      <span className="text-green-300 font-bold">₺780</span>
                    </div>
                    <div className="text-center pt-4">
                      <span className="text-yellow-300 font-medium">💰 %15 indirim aktif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="container-page">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Neden Tyrex B2B?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Modern teknoloji ile lastik ticaretini kolaylaştırıyoruz. 
                İşinizi büyütmeniz için ihtiyacınız olan her şey burada.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="p-6 rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-lg transition-all group">
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

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50">
          <div className="container-page">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Müşterilerimiz Ne Diyor?
              </h2>
              <p className="text-xl text-gray-600">
                Binlerce memnun perakendecinin deneyimlerini dinleyin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-white">
          <div className="container-page">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Size Uygun Planı Seçin
              </h2>
              <p className="text-xl text-gray-600">
                İşletmenizin büyüklüğüne göre tasarlanmış esnek planlar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <div key={index} className={`relative p-8 rounded-2xl border-2 ${
                  plan.popular 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 bg-white'
                } hover:shadow-lg transition-all`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                        En Popüler
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link 
                    href="/auth/register" 
                    className={`btn w-full ${
                      plan.popular 
                        ? 'btn-primary' 
                        : 'btn-outline'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="container-page text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Hemen Başlayın
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              7 günlük ücretsiz deneme ile Tyrex B2B'nin tüm özelliklerini keşfedin. 
              Kredi kartı gerekmez, istediğiniz zaman iptal edebilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="btn btn-lg bg-white text-primary-600 hover:bg-gray-50 px-8 py-4">
                Ücretsiz Hesap Oluştur
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/demo" className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4">
                Demo İzle
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default HomePage;