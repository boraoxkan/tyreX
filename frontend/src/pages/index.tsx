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
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { subscriptionsApi, SubscriptionPlan } from '@/lib/api';
import { useState, useEffect } from 'react';

const HomePage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const fetchedPlans = await subscriptionsApi.getSubscriptionPlans();
        console.log("Fetched plans:", fetchedPlans); // Debugging
        
        // API'den gelen veriyi array olarak ayarla ve frontend için gerekli alanları ekle
        const plansArray = Array.isArray(fetchedPlans) ? fetchedPlans : [];
        const plansWithExtras = plansArray.map((plan: any) => ({
          ...plan,
          popular: plan.plan_type === 'pro_plus', // PRO PLUS planı popüler yap
          cta: plan.plan_type === 'pro' ? '14 Gün Ücretsiz Dene' : 
               plan.plan_type === 'ultra' ? 'Hemen Başla' : 'Planı Seç'
        }));
        setPlans(plansWithExtras as SubscriptionPlan[]);
      } catch (error) {
        console.error("Failed to fetch subscription plans:", error);
        setPlans([]); // Hata durumunda boş array
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);
  const features = [
    {
      icon: ShoppingCart,
      title: 'Stok Yönetimi',
      description: 'Gerçek zamanlı stok takibi, minimum stok seviyeleri ve otomatik uyarılar ile envanterinizi optimize edin.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: TrendingUp,
      title: 'Depo Yönetimi',
      description: 'Çoklu depo desteği, depo arası transferler ve lokasyon bazlı stok takibi ile lojistiğinizi kolaylaştırın.',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Zap,
      title: 'Pazaryeri Erişimi',
      description: 'Binlerce ürüne ve onlarca toptancıya tek bir platformdan ulaşın, en iyi fiyatları anında karşılaştırın.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Users,
      title: 'Müşteri Yönetimi',
      description: 'Müşteri bilgileri, sipariş geçmişi ve lastik oteli takibi ile müşteri ilişkilerinizi güçlendirin.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: Shield,
      title: 'Akıllı Raporlama',
      description: 'Satış, kar ve envanter raporları ile veriye dayalı kararlar alarak işletmenizi büyütün.',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      icon: Globe,
      title: 'Kolay Sipariş Yönetimi',
      description: 'Tek tıkla sipariş oluşturma, sipariş takibi ve otomatik faturalandırma ile operasyonel yükünüzü azaltın.',
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
                  Lastik Ticaretinin
                  <span className="block text-gradient bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Yeni Nesil Platformu
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl opacity-90 mb-8 leading-relaxed">
                  Toptancılar ve perakendeciler için özel olarak tasarlanmış, akıllı ve verimli bir B2B platformu. Stoklarınızı yönetin, satışlarınızı artırın ve rekabette bir adım öne geçin.
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
                  ✓ Anında başlayın • ✓ İstediğiniz zaman iptal edin
                </p>
              </div>

              
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="container-page">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                tyreX ile İşinizi Geleceğe Taşıyın
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Sektörün zorluklarını anlıyor ve onlara özel çözümler sunuyoruz. tyreX, lastik ticaretini daha karlı, daha hızlı ve daha kolay hale getirmek için tasarlandı.
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
              {isLoadingPlans ? (
                <div className="col-span-full text-center py-10">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600">Planlar yükleniyor...</p>
                </div>
              ) : (
                plans.map((plan, index) => (
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
                        <span className="text-4xl font-bold text-gray-900">{plan.monthly_price}</span>
                        <span className="text-gray-600">/ay</span>
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
                ))
              )}
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
              7 günlük ücretsiz deneme ile tyreX'nin tüm özelliklerini keşfedin. 
              İstediğiniz zaman iptal edebilirsiniz.
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

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8">
          <div className="container-page text-center text-sm">
            &copy; 2025 One Eye Systems. Tüm hakları saklıdır.
          </div>
        </footer>
      </Layout>
    </>
  );
};

export default HomePage;