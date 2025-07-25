import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Users, 
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Star,
  Calendar
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/store/authStore';
import { userApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  total_spent: string;
  marketplace_views: number;
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, company, subscription, hasMarketplaceAccess } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for error messages from URL
  useEffect(() => {
    if (router.query.error === 'marketplace_access_required') {
      setError('Pazaryerine erişmek için planınızı yükseltmeniz gerekiyor.');
    }
  }, [router.query]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Load company info and wholesaler relationships
        const companyData = await userApi.getCompanyInfo();
        setCompanyInfo(companyData);

        // Mock stats for now (in real app, this would come from API)
        setStats({
          total_orders: 12,
          pending_orders: 3,
          total_spent: '45,750.00',
          marketplace_views: 156,
        });

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setError('Dashboard verileri yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Quick stats data
  const quickStats = [
    {
      name: 'Toplam Sipariş',
      value: stats?.total_orders || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Bekleyen Sipariş',
      value: stats?.pending_orders || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Toplam Harcama',
      value: stats ? formatCurrency(parseFloat(stats.total_spent)) : '₺0',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Pazaryeri Görüntüleme',
      value: stats?.marketplace_views || 0,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  // Recent activities (mock data)
  const recentActivities = [
    {
      id: 1,
      type: 'order',
      message: 'Yeni sipariş oluşturuldu: #ORD-2024-001',
      date: new Date(),
      status: 'success',
    },
    {
      id: 2,
      type: 'payment',
      message: 'Ödeme tamamlandı: ₺2,450.00',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'success',
    },
    {
      id: 3,
      type: 'marketplace',
      message: 'Pazaryerinde 15 yeni ürün görüntülendi',
      date: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'info',
    },
  ];

  if (isLoading) {
    return (
      <AuthGuard>
        <Layout title="Dashboard">
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
        <title>Dashboard - Tyrex B2B</title>
        <meta name="description" content="Tyrex B2B Dashboard" />
      </Head>

      <Layout title="Dashboard">
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error">
              <div className="flex">
                <AlertCircle className="h-5 w-5" />
                <div className="ml-3">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  Hoş geldiniz, {user?.first_name}! 👋
                </h1>
                <p className="mt-1 opacity-90">
                  {company?.name} • {formatDate(new Date())}
                </p>
                {subscription && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                      {subscription.plan} • {subscription.status}
                    </span>
                  </div>
                )}
              </div>
              
              {hasMarketplaceAccess && (
                <div className="text-right">
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Pazaryeri
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Hızlı İşlemler</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hasMarketplaceAccess ? (
                      <Link
                        href="/marketplace"
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                      >
                        <div className="flex items-center">
                          <ShoppingCart className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-gray-900">Pazaryeri</h4>
                            <p className="text-xs text-gray-500">Ürünleri keşfedin</p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-75">
                        <div className="flex items-center">
                          <ShoppingCart className="h-8 w-8 text-gray-400" />
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-gray-600">Pazaryeri</h4>
                            <p className="text-xs text-gray-500">Plan gerekli</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Link
                      href="/orders"
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <Package className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">Siparişlerim</h4>
                          <p className="text-xs text-gray-500">Siparişleri görüntüle</p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/reports"
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">Raporlar</h4>
                          <p className="text-xs text-gray-500">Satış analizi</p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/settings"
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">Ayarlar</h4>
                          <p className="text-xs text-gray-500">Hesap yönetimi</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Son Aktiviteler</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`p-1 rounded-full ${
                          activity.status === 'success' ? 'bg-green-100' :
                          activity.status === 'info' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {activity.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(activity.date, { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company & Wholesaler Info */}
          {companyInfo && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Şirket Bilgileri</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Şirket Detayları</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-xs text-gray-500">Şirket Adı</dt>
                        <dd className="text-sm text-gray-900">{companyInfo.company?.name}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">E-posta</dt>
                        <dd className="text-sm text-gray-900">{companyInfo.company?.email}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Telefon</dt>
                        <dd className="text-sm text-gray-900">{companyInfo.company?.phone || 'Belirtilmemiş'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Toptancı İlişkileri ({companyInfo.wholesaler_relationships?.length || 0})
                    </h4>
                    {companyInfo.wholesaler_relationships?.length >