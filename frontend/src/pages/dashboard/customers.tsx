import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  Star,
  Warehouse,
  Calendar,
  TrendingUp,
  AlertCircle,
  Car,
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Eye,
  Settings,
  MoreVertical
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { useAuth } from '@/store/authStore';
import { customersApi, Customer, CustomerDashboard } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

const CustomersPage: React.FC = () => {
  const { user, company } = useAuth();
  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showVipOnly, setShowVipOnly] = useState(false);
  const [showTireHotelOnly, setShowTireHotelOnly] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [searchTerm, filterType, showVipOnly, showTireHotelOnly]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const dashboardData = await customersApi.getDashboard();
      setDashboard(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Dashboard verileri yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (filterType !== 'all') {
        params.append('customer_type', filterType);
      }
      
      if (showVipOnly) {
        params.append('vip_only', 'true');
      }
      
      if (showTireHotelOnly) {
        params.append('tire_hotel_only', 'true');
      }

      const response = await customersApi.getCustomers(params);
      setCustomers(response.results || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]); // Hata durumunda boş array set et
    }
  };

  const handleToggleVip = async (customerId: number) => {
    try {
      await customersApi.toggleVip(customerId);
      loadCustomers(); // Refresh the list
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Failed to toggle VIP status:', error);
    }
  };

  const stats = dashboard?.stats;

  const quickStats = [
    {
      name: 'Toplam Müşteri',
      value: stats?.total_customers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Aktif Müşteri',
      value: stats?.active_customers || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'VIP Müşteri',
      value: stats?.vip_customers || 0,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Lastik Oteli',
      value: stats?.tire_hotel_customers || 0,
      icon: Warehouse,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const visitStats = [
    {
      name: "Bugünkü Ziyaret",
      value: stats?.total_visits_today || 0,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: "Aylık Ziyaret",
      value: stats?.total_visits_this_month || 0,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      name: "Memnuniyet",
      value: stats?.avg_customer_satisfaction ? `${stats.avg_customer_satisfaction.toFixed(1)}/5` : 'N/A',
      icon: Star,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      name: "Vadesi Geçen",
      value: stats?.overdue_pickups || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  if (isLoading) {
    return (
      <AuthGuard>
        <Layout title="Müşterilerim">
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
        <title>Müşterilerim - Tyrex B2B</title>
        <meta name="description" content="Müşteri yönetimi ve takip sistemi" />
      </Head>

      <Layout title="Müşterilerim">
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="ml-3">
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Müşterilerim</h1>
              <p className="mt-1 text-gray-600">
                Müşteri takip ve lastik oteli yönetimi
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                href="/dashboard/customers/new"
                icon={<UserPlus className="h-4 w-4" />}
                variant="primary"
              >
                Yeni Müşteri
              </Button>
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

          {/* Visit & Tire Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visitStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-gray-600">{stat.name}</p>
                        <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customers List */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Müşteri Listesi</h3>
                    <span className="text-sm text-gray-500">
                      {customers?.length || 0} müşteri
                    </span>
                  </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Müşteri ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="all">Tüm Türler</option>
                        <option value="individual">Bireysel</option>
                        <option value="business">Kurumsal</option>
                        <option value="fleet">Filo</option>
                      </select>
                    </div>

                    {/* VIP Filter */}
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showVipOnly}
                        onChange={(e) => setShowVipOnly(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">VIP</span>
                    </label>

                    {/* Tire Hotel Filter */}
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showTireHotelOnly}
                        onChange={(e) => setShowTireHotelOnly(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Lastik Oteli</span>
                    </label>
                  </div>
                </div>

                <div className="card-body">
                  {!customers || customers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Müşteri bulunamadı</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Yeni müşteri ekleyerek başlayın.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customers?.map((customer) => (
                        <div
                          key={customer.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                                    {customer.full_name}
                                    {customer.is_vip && (
                                      <Star className="ml-2 h-4 w-4 text-yellow-500 fill-current" />
                                    )}
                                    {customer.tire_hotel_enabled && (
                                      <Warehouse className="ml-2 h-4 w-4 text-purple-500" />
                                    )}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {customer.customer_type_display}
                                    {customer.customer_code && ` • ${customer.customer_code}`}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                {customer.phone && (
                                  <div className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {customer.phone}
                                  </div>
                                )}
                                {customer.email && (
                                  <div className="flex items-center">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {customer.email}
                                  </div>
                                )}
                                {customer.tire_hotel_enabled && (
                                  <div className="flex items-center">
                                    <Car className="h-3 w-3 mr-1" />
                                    {customer.total_tire_storage_count} / {customer.tire_storage_capacity || '∞'} lastik
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleVip(customer.id)}
                              >
                                {customer.is_vip ? 'VIP Kaldır' : 'VIP Yap'}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="primary"
                                icon={<Eye className="h-4 w-4" />}
                                href={`/dashboard/customers/${customer.id}`}
                              >
                                Detay
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Recent Visits */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Son Ziyaretler</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    {dashboard?.recent_visits?.slice(0, 5).map((visit) => (
                      <div key={visit.id} className="flex items-start space-x-3">
                        <div className="p-1 rounded-full bg-green-100">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{visit.customer_name}</p>
                          <p className="text-xs text-gray-500">
                            {visit.visit_type_display} • {formatDate(new Date(visit.visit_date), { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">Henüz ziyaret bulunmuyor.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Tire Storage */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Son Depolanan Lastikler</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    {dashboard?.recent_tire_storage?.slice(0, 5).map((tire) => (
                      <div key={tire.id} className="flex items-start space-x-3">
                        <div className="p-1 rounded-full bg-purple-100">
                          <Warehouse className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{tire.customer_name}</p>
                          <p className="text-xs text-gray-500">
                            {tire.tire_brand} {tire.tire_model} • {tire.tire_size}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(new Date(tire.storage_date))}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">Henüz depolanan lastik bulunmuyor.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Hızlı İşlemler</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      icon={<Calendar className="h-4 w-4" />}
                      href="/dashboard/customers/visits"
                    >
                      Tüm Ziyaretler
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      icon={<Warehouse className="h-4 w-4" />}
                      href="/dashboard/customers/tire-storage"
                    >
                      Lastik Oteli
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      icon={<TrendingUp className="h-4 w-4" />}
                      href="/dashboard/customers/reports"
                    >
                      Müşteri Raporları
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default CustomersPage;