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
  Calendar,
  Settings
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PremiumFeatureCard from '@/components/ui/PremiumFeatureCard';
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
  const { 
    user, 
    company, 
    subscription, 
    hasMarketplaceAccess,
    hasCustomerManagementAccess,
    hasFullDashboardAccess
  } = useAuth();
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

        // Load real dashboard stats from API
        try {
          const dashboardStats = await userApi.getDashboardStats();
          setStats(dashboardStats);
        } catch (statsError) {
          console.warn('Failed to load dashboard stats, using fallback data:', statsError);
          // Fallback to mock data if API fails
          setStats({
            total_orders: 0,
            pending_orders: 0,
            total_spent: '0.00',
            marketplace_views: 0,
          });
        }

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
      name: 'Günün İşi',
      value: stats?.daily_tasks || 5,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Toplam Harcama',
      value: stats ? formatCurrency(parseFloat(stats.total_spent)) : '₺0',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    
  ];

  // Daily tasks (mock data)
  const dailyTasks = [
    {
      id: 1,
      type: 'inventory',
      task: 'Stok sayımı kontrolü',
      priority: 'high',
      completed: false,
      dueTime: '10:00',
    },
    {
      id: 2,
      type: 'customer',
      task: 'Müşteri ziyareti - ABC Lastik',
      priority: 'medium',
      completed: true,
      dueTime: '14:00',
    },
    {
      id: 3,
      type: 'delivery',
      task: 'Kargo hazırlık - 5 paket',
      priority: 'medium',
      completed: false,
      dueTime: '16:30',
    },
    {
      id: 4,
      type: 'maintenance',
      task: 'Depo temizliği ve düzen',
      priority: 'low',
      completed: false,
      dueTime: '18:00',
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
        <title>Dashboard - tyreX</title>
        <meta name="description" content="tyreX Dashboard" />
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
                      {subscription.plan?.name} • {subscription.status_display}
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
              const isPremiumStat = stat.name === 'Toplam Sipariş';

              // Sadece erişim hakkı olanları göster
              if (isPremiumStat && !hasFullDashboardAccess) {
                return null;
              }
              
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
            {/* Charts & Statistics */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">İstatistikler</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Müşteri Sayısı Grafiği */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Müşteri İstatistikleri</h4>
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      {hasCustomerManagementAccess ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Toplam Müşteri</span>
                            <span className="text-lg font-semibold text-gray-900">{companyInfo?.customer_count || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Aktif Müşteri</span>
                            <span className="text-lg font-semibold text-green-600">{Math.floor((companyInfo?.customer_count || 0) * 0.8)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">VIP Müşteri</span>
                            <span className="text-lg font-semibold text-purple-600">{Math.floor((companyInfo?.customer_count || 0) * 0.15)}</span>
                          </div>
                          <Link 
                            href="/dashboard/customers" 
                            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Detayları Gör
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </div>
                      ) : (
                        <PremiumFeatureCard
                          title="Müşteri Takibi"
                          description="PRO PLUS ile müşteri istatistiklerini görün"
                          requiredPlan="PRO PLUS"
                          requiredPrice="₺350/ay"
                        >
                          <div className="text-center py-6">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Müşteri istatistikleri</p>
                          </div>
                        </PremiumFeatureCard>
                      )}
                    </div>

                    {/* Stok Durumu Grafiği */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Stok Durumu</h4>
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Toplam Ürün</span>
                          <span className="text-lg font-semibold text-gray-900">{stats?.total_products || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Stokta Var</span>
                          <span className="text-lg font-semibold text-green-600">{Math.floor((stats?.total_products || 0) * 0.75)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Düşük Stok</span>
                          <span className="text-lg font-semibold text-yellow-600">{Math.floor((stats?.total_products || 0) * 0.15)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Stokta Yok</span>
                          <span className="text-lg font-semibold text-red-600">{Math.floor((stats?.total_products || 0) * 0.1)}</span>
                        </div>
                        <Link 
                          href="/dashboard/my-stock" 
                          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Stoku Yönet
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Aylık Satış Trendi */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Aylık Performans</h4>
                        <TrendingUp className="h-5 w-5 text-gray-400" />
                      </div>
                      {hasFullDashboardAccess ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Bu Ay Satış</span>
                            <span className="text-lg font-semibold text-gray-900">₺{(Math.random() * 50000 + 10000).toFixed(0)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Geçen Ay</span>
                            <span className="text-lg font-semibold text-gray-600">₺{(Math.random() * 40000 + 8000).toFixed(0)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Artış</span>
                            <span className="text-lg font-semibold text-green-600">+{(Math.random() * 20 + 5).toFixed(1)}%</span>
                          </div>
                          <Link 
                            href="/reports" 
                            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Raporları Gör
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </div>
                      ) : (
                        <PremiumFeatureCard
                          title="Satış Raporları"
                          description="PRO PLUS ile detaylı raporlara erişin"
                          requiredPlan="PRO PLUS"
                          requiredPrice="₺350/ay"
                        >
                          <div className="text-center py-6">
                            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Satış analitikleri</p>
                          </div>
                        </PremiumFeatureCard>
                      )}
                    </div>

                    {/* Hızlı Erişim Menüsü */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Hızlı Erişim</h4>
                        <Settings className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="space-y-3">
                        <Link
                          href="/dashboard/my-warehouses"
                          className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <span className="text-sm text-gray-700">Depolarım</span>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </Link>
                        {hasMarketplaceAccess && (
                          <Link
                            href="/marketplace"
                            className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors"
                          >
                            <span className="text-sm text-gray-700">Pazaryeri</span>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </Link>
                        )}
                        <Link
                          href="/settings"
                          className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <span className="text-sm text-gray-700">Ayarlar</span>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </Link>
                      </div>
                    </div>

                    {/* Sipariş Yönetimi - Yakında */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-orange-900">Sipariş Yönetimi</h4>
                        <Package className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="text-center py-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-200 rounded-full mb-3">
                          <Package className="h-6 w-6 text-orange-700" />
                        </div>
                        <div className="space-y-2">
                          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-200 text-orange-800">
                            🚀 Yakında!
                          </div>
                          <p className="text-sm text-orange-800 font-medium">Gelişmiş Sipariş Sistemi</p>
                          <p className="text-xs text-orange-600">
                            Otomatik sipariş oluşturma, toplu işlemler ve gelişmiş takip özellikleri geliştiriliyor
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sepet İşlemleri - Yakında */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-blue-900">Sepet İşlemleri</h4>
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-center py-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-200 rounded-full mb-3">
                          <ShoppingCart className="h-6 w-6 text-blue-700" />
                        </div>
                        <div className="space-y-2">
                          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                            ⭐ Çok Yakında!
                          </div>
                          <p className="text-sm text-blue-800 font-medium">Akıllı Sepet Yönetimi</p>
                          <p className="text-xs text-blue-600">
                            Kaydetme, favoriler, fiyat takibi ve öneriler sistemi hazırlanıyor
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Tasks & Activity */}
            <div>
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Günün İşleri</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    {dailyTasks.map((task) => (
                      <div key={task.id} className="flex items-start space-x-3">
                        <div className={`p-1 rounded-full ${
                          task.completed ? 'bg-green-100' : 
                          task.priority === 'high' ? 'bg-red-100' :
                          task.priority === 'medium' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          {task.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : task.priority === 'high' ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.task}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              task.priority === 'high' ? 'bg-red-50 text-red-600' :
                              task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' : 
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {task.priority === 'high' ? 'Acil' : 
                               task.priority === 'medium' ? 'Orta' : 'Düşük'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            ⏰ {task.dueTime}
                            {task.completed && ' - ✓ Tamamlandı'}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        Tamamlanan: {dailyTasks.filter(t => t.completed).length} / {dailyTasks.length}
                      </p>
                    </div>
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
                    {companyInfo.wholesaler_relationships?.length > 0 ? (
                      <div className="space-y-2">
                        {companyInfo.wholesaler_relationships.slice(0, 3).map((relation: any, index: number) => (
                          <div key={index} className="text-sm">
                            <p className="font-medium text-gray-900">{relation.wholesaler_name}</p>
                            <p className="text-xs text-gray-500">
                              Kredi Limiti: {relation.credit_limit ? formatCurrency(relation.credit_limit) : 'Belirtilmemiş'}
                            </p>
                          </div>
                        ))}
                        {companyInfo.wholesaler_relationships.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{companyInfo.wholesaler_relationships.length - 3} tane daha...
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Henüz toptancı ilişkisi bulunmamaktadır.
                      </p>
                    )}
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

export default DashboardPage;