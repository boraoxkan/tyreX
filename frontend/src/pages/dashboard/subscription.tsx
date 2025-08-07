// frontend/src/pages/dashboard/subscription.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Star,
  ArrowRight,
  Clock,
  Zap,
  Shield,
  BarChart3,
  X
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/store/authStore';
import { formatDate, formatCurrency } from '@/lib/utils';

interface SubscriptionPlan {
  id: string;
  name: string;
  type: string;
  monthly_price: number;
  yearly_price?: number;
  description: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

const SubscriptionPage: React.FC = () => {
  const { user, company, subscription } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Mock plans data - in real app, this would come from API
  useEffect(() => {
    const mockPlans: SubscriptionPlan[] = [
      {
        id: 'free',
        name: 'Ücretsiz',
        type: 'free',
        monthly_price: 0,
        description: 'Başlangıç için ideal',
        features: [
          '1 kullanıcı',
          '1 depo',
          '50 ürün limiti',
          'Temel raporlar',
          'E-posta desteği'
        ]
      },
      {
        id: 'customer_access',
        name: 'Müşteri Takibi',
        type: 'customer_access',
        monthly_price: 300,
        yearly_price: 3000,
        description: 'Müşteri yönetimi için',
        features: [
          '3 kullanıcı',
          '2 depo',
          '200 ürün limiti',
          'Müşteri takip sistemi',
          'Lastik oteli yönetimi',
          'Müşteri raporları',
          'E-posta desteği'
        ],
        current: subscription?.plan === 'Müşteri Takibi'
      },
      {
        id: 'basic',
        name: 'Temel',
        type: 'basic',
        monthly_price: 299,
        yearly_price: 2990,
        description: 'Küçük işletmeler için',
        features: [
          '3 kullanıcı',
          '2 depo',
          '500 ürün limiti',
          'Pazaryeri erişimi',
          'Dinamik fiyatlandırma',
          'Detaylı raporlar',
          'Öncelikli destek'
        ],
        current: subscription?.plan === 'Temel Plan'
      },
      {
        id: 'premium',
        name: 'Premium',
        type: 'premium',
        monthly_price: 4500,
        yearly_price: 45000,
        description: 'Tam erişim için',
        features: [
          '10 kullanıcı',
          '5 depo',
          '2000 ürün limiti',
          'Tüm dashboard özellikleri',
          'Müşteri takip sistemi',
          'Pazaryeri erişimi',
          'Gelişmiş analitik',
          'AI destekli özellikler',
          '7/24 destek'
        ],
        popular: true,
        current: subscription?.plan === 'Premium'
      },
      {
        id: 'enterprise',
        name: 'Kurumsal',
        type: 'enterprise',
        monthly_price: 1299,
        yearly_price: 12990,
        description: 'Büyük şirketler için',
        features: [
          'Sınırsız kullanıcı',
          'Sınırsız depo',
          'Sınırsız ürün',
          'Özel geliştirmeler',
          'Dedicated hesap yöneticisi',
          'SLA garantisi',
          'On-premise seçenekleri'
        ]
      }
    ];

    setPlans(mockPlans);
    setIsLoading(false);
  }, [subscription]);

  const calculateYearlyDiscount = (monthly: number, yearly?: number) => {
    if (!yearly) return 0;
    const yearlyEquivalent = monthly * 12;
    return Math.round(((yearlyEquivalent - yearly) / yearlyEquivalent) * 100);
  };

  const getTrialDaysRemaining = () => {
    if (!subscription?.trial_end_date) return 0;
    const endDate = new Date(subscription.trial_end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  const isTrialActive = subscription?.status === 'trialing' && trialDaysRemaining > 0;

  if (isLoading) {
    return (
      <AuthGuard>
        <Layout title="Abonelik">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Head>
        <title>Abonelik - Tyrex B2B</title>
        <meta name="description" content="Abonelik planınızı yönetin" />
      </Head>

      <Layout title="Abonelik">
        <div className="space-y-8">
          {/* Current Subscription Status */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {subscription?.plan || 'Plan Seçilmemiş'}
                </h2>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                    {subscription?.status === 'trialing' ? 'Deneme Sürümü' : 
                     subscription?.status === 'active' ? 'Aktif' : 'Beklemede'}
                  </span>
                  {isTrialActive && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning-500/20">
                      <Clock className="h-4 w-4 mr-1" />
                      {trialDaysRemaining} gün kaldı
                    </span>
                  )}
                </div>
                {subscription?.trial_end_date && isTrialActive && (
                  <p className="mt-2 text-primary-100">
                    Deneme süreniz {formatDate(subscription.trial_end_date)} tarihinde sona eriyor
                  </p>
                )}
              </div>
              <div className="text-right">
                <CreditCard className="h-12 w-12 text-white/80 mb-2" />
                {subscription?.marketplace_access && (
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Pazaryeri Aktif
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trial Warning */}
          {isTrialActive && trialDaysRemaining <= 3 && (
            <div className="alert alert-warning">
              <div className="flex">
                <AlertCircle className="h-5 w-5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Deneme süreniz yakında doluyor</h3>
                  <p className="mt-1 text-sm">
                    Hizmetlerimizi kesintisiz kullanmaya devam etmek için bir plan seçin.
                    Deneme süreniz {trialDaysRemaining} gün içinde sona erecek.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yıllık
                <span className="ml-1 text-xs text-green-600 font-medium">%20 İndirim</span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const price = billingCycle === 'yearly' ? plan.yearly_price : plan.monthly_price;
              const yearlyDiscount = calculateYearlyDiscount(plan.monthly_price, plan.yearly_price);
              
              return (
                <div
                  key={plan.id}
                  className={`relative card ${
                    plan.popular ? 'ring-2 ring-primary-500' : ''
                  } ${plan.current ? 'bg-primary-50 border-primary-200' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        En Popüler
                      </span>
                    </div>
                  )}

                  {plan.current && (
                    <div className="absolute -top-3 right-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mevcut Plan
                      </span>
                    </div>
                  )}

                  <div className="card-body">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {plan.description}
                      </p>
                      <div className="mb-4">
                        {price ? (
                          <>
                            <span className="text-4xl font-bold text-gray-900">
                              {formatCurrency(price)}
                            </span>
                            <span className="text-gray-600">
                              /{billingCycle === 'monthly' ? 'ay' : 'yıl'}
                            </span>
                            {billingCycle === 'yearly' && yearlyDiscount > 0 && (
                              <div className="text-sm text-green-600 font-medium mt-1">
                                %{yearlyDiscount} tasarruf
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-4xl font-bold text-gray-900">Ücretsiz</span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => setSelectedPlan(plan.id)}
                      disabled={plan.current}
                      className={`w-full btn ${
                        plan.current
                          ? 'btn-secondary cursor-not-allowed'
                          : plan.popular
                          ? 'btn-primary'
                          : 'btn-outline'
                      }`}
                    >
                      {plan.current ? (
                        'Mevcut Plan'
                      ) : plan.type === 'free' ? (
                        'Ücretsiz Başla'
                      ) : (
                        <>
                          Planı Seç
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features Comparison */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Plan Karşılaştırması
              </h3>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Özellik</th>
                      <th className="text-center py-3 px-4">Ücretsiz</th>
                      <th className="text-center py-3 px-4">Müşteri Takibi</th>
                      <th className="text-center py-3 px-4">Temel</th>
                      <th className="text-center py-3 px-4">Premium</th>
                      <th className="text-center py-3 px-4">Kurumsal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-3 px-4 font-medium">Kullanıcı Sayısı</td>
                      <td className="text-center py-3 px-4">1</td>
                      <td className="text-center py-3 px-4">3</td>
                      <td className="text-center py-3 px-4">3</td>
                      <td className="text-center py-3 px-4">10</td>
                      <td className="text-center py-3 px-4">Sınırsız</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">Depo Sayısı</td>
                      <td className="text-center py-3 px-4">1</td>
                      <td className="text-center py-3 px-4">2</td>
                      <td className="text-center py-3 px-4">2</td>
                      <td className="text-center py-3 px-4">5</td>
                      <td className="text-center py-3 px-4">Sınırsız</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">Müşteri Takibi</td>
                      <td className="text-center py-3 px-4">
                        <X className="h-5 w-5 text-error-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <CheckCircle className="h-5 w-5 text-success-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <X className="h-5 w-5 text-error-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <CheckCircle className="h-5 w-5 text-success-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <CheckCircle className="h-5 w-5 text-success-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">Pazaryeri Erişimi</td>
                      <td className="text-center py-3 px-4">
                        <X className="h-5 w-5 text-error-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <X className="h-5 w-5 text-error-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <CheckCircle className="h-5 w-5 text-success-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <CheckCircle className="h-5 w-5 text-success-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <CheckCircle className="h-5 w-5 text-success-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">Tam Dashboard</td>
                      <td className="text-center py-3 px-4">
                        <X className="h-5 w-5 text-error-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <X className="h-5 w-5 text-error-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <X className="h-5 w-5 text-error-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <CheckCircle className="h-5 w-5 text-success-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <CheckCircle className="h-5 w-5 text-success-500 mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          {subscription && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">API Kullanımı</p>
                      <p className="text-lg font-semibold text-gray-900">
                        247 / 1,000
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24.7%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Zap className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Bu Ay Sipariş</p>
                      <p className="text-lg font-semibold text-gray-900">12</p>
                      <p className="text-xs text-gray-500">Geçen ay: 8</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Güvenlik Skoru</p>
                      <p className="text-lg font-semibold text-gray-900">95/100</p>
                      <p className="text-xs text-green-600">Mükemmel</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default SubscriptionPage;