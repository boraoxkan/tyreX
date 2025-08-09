// frontend/src/pages/dashboard/orders.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Package, 
  Calendar, 
  TrendingUp, 
  Eye,
  Filter,
  Download,
  Search,
  CheckCircle,
  Clock,
  Truck,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import { ordersApi, Order, handleApiError } from '@/lib/api';

const OrdersPage: React.FC = () => {
  const router = useRouter();
  
  // Component state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Success message from cart
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load orders on mount
  useEffect(() => {
    loadOrders();
    loadStats();
    
    // Check for success message from cart redirect
    if (router.query.success && router.query.orderNumber) {
      setSuccessMessage(`Sipariş ${router.query.orderNumber} başarıyla oluşturuldu!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Clean URL
      router.replace('/dashboard/orders', undefined, { shallow: true });
    }
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadOrders();
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const response = await ordersApi.getOrders(params);
      setOrders(response.results || response);
      
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Failed to load orders:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await ordersApi.getOrdersSummary();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load order stats:', handleApiError(err));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const formatPrice = (price: string) => {
    return `₺${parseFloat(price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, statusDisplay: string) => {
    const statusClasses = {
      'draft': 'badge-gray',
      'pending': 'badge-warning',
      'confirmed': 'badge-primary',
      'processing': 'badge-primary',
      'shipped': 'badge-warning',
      'delivered': 'badge-success',
      'canceled': 'badge-error',
      'rejected': 'badge-error',
    };
    
    const statusIcons = {
      'draft': Clock,
      'pending': Clock,
      'confirmed': CheckCircle,
      'processing': Package,
      'shipped': Truck,
      'delivered': CheckCircle,
      'canceled': X,
      'rejected': X,
    };
    
    const IconComponent = statusIcons[status as keyof typeof statusIcons] || Clock;
    
    return (
      <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'badge-gray'}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {statusDisplay}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string, statusDisplay: string) => {
    const statusClasses = {
      'pending': 'badge-warning',
      'paid': 'badge-success',
      'partially_paid': 'badge-warning',
      'failed': 'badge-error',
      'refunded': 'badge-gray',
    };
    
    return (
      <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'badge-gray'}`}>
        {statusDisplay}
      </span>
    );
  };

  return (
    <AuthGuard>
      <Head>
        <title>Siparişlerim - tyreX</title>
        <meta name="description" content="Siparişlerinizi görüntüleyin ve takip edin" />
      </Head>

      <Layout title="Siparişlerim">
        <div className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="alert alert-success">
              <CheckCircle className="h-5 w-5 mr-2" />
              {successMessage}
              <button 
                onClick={() => setSuccessMessage(null)}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats.total_orders}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Toplam Tutar</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatPrice(stats.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Bu Ay</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats.recent_30_days.count}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ortalama Sipariş</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatPrice(stats.recent_30_days.average_order_value)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Sipariş numarası veya toptancı ara..."
                      className="form-input pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Ara
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn btn-outline"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrele
                  </button>

                  <button
                    type="button"
                    onClick={loadOrders}
                    className="btn btn-outline"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Yenile
                  </button>
                </div>
              </form>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="form-label">Sipariş Durumu</label>
                      <select
                        className="form-input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">Tümü</option>
                        <option value="pending">Beklemede</option>
                        <option value="confirmed">Onaylandı</option>
                        <option value="processing">İşleniyor</option>
                        <option value="shipped">Kargoda</option>
                        <option value="delivered">Teslim Edildi</option>
                        <option value="canceled">İptal Edildi</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Başlangıç Tarihi</label>
                      <input
                        type="date"
                        className="form-input"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label">Bitiş Tarihi</label>
                      <input
                        type="date"
                        className="form-input"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('');
                          setDateFrom('');
                          setDateTo('');
                        }}
                        className="btn btn-outline w-full"
                      >
                        Filtreleri Temizle
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="spinner h-8 w-8 mx-auto mb-4"></div>
              <p className="text-gray-600">Siparişler yükleniyor...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
              <button 
                onClick={loadOrders}
                className="ml-4 btn btn-sm btn-outline"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Orders List */}
          {!loading && !error && (
            <>
              {orders && orders.length > 0 ? (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">
                      Siparişler ({orders.length})
                    </h3>
                  </div>
                  <div className="card-body p-0">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sipariş No
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Toptancı
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ürünler
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Toplam
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Durum
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ödeme
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.order_number}
                                </div>
                                <div className="text-xs text-gray-500">
                                  #{order.id}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(order.order_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {order.wholesaler_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                <div className="space-y-1">
                                  {order.items && order.items.length > 0 ? (
                                    <>
                                      {order.items.slice(0, 2).map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center">
                                          <span className="truncate mr-2" title={item.product_name}>
                                            {item.product_name}
                                          </span>
                                          <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {item.quantity} adet
                                          </span>
                                        </div>
                                      ))}
                                      {order.items.length > 2 && (
                                        <div className="text-xs text-gray-400">
                                          +{order.items.length - 2} ürün daha...
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div>{order.total_items} adet</div>
                                  )}
                                  <div className="text-xs text-gray-400 border-t pt-1 mt-1">
                                    {order.total_unique_products} farklı ürün
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatPrice(order.total_amount)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {order.currency}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(order.status, order.status_display)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getPaymentStatusBadge(order.payment_status, order.payment_status_display)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link 
                                  href={`/dashboard/orders/${order.id}`}
                                  className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Detay
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {searchTerm || statusFilter || dateFrom || dateTo 
                      ? 'Arama kriterlerinize uygun sipariş bulunamadı'
                      : 'Henüz siparişiniz yok'
                    }
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || statusFilter || dateFrom || dateTo
                      ? 'Farklı filtreler deneyebilir veya filtreleri temizleyebilirsiniz.'
                      : 'Pazaryerinden ilk siparişinizi vererek başlayın.'
                    }
                  </p>
                  {searchTerm || statusFilter || dateFrom || dateTo ? (
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('');
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="btn btn-outline mr-4"
                    >
                      Filtreleri Temizle
                    </button>
                  ) : null}
                  <Link href="/dashboard/products" className="btn btn-primary">
                    Pazaryerine Git
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Status Distribution */}
          {stats && stats.status_distribution && Object.keys(stats.status_distribution).length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  Sipariş Durum Dağılımı
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.status_distribution).map(([status, data]: [string, any]) => (
                    <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-semibold text-gray-900 mb-1">
                        {data.count}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {data.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        %{data.percentage}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default OrdersPage;