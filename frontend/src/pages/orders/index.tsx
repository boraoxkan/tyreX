import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Package, Calendar, TrendingUp, Search, Filter, Eye, MoreVertical, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ordersApi, Order } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/store/authStore';

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await ordersApi.getOrders(params);
      setOrders(response.results);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      setError('Siparişler yüklenirken bir hata oluştu.');
      setOrders([]); // Set empty array as fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadOrders();
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'delivered': 'badge-success',
      'shipped': 'badge-info', 
      'processing': 'badge-warning',
      'confirmed': 'badge-primary',
      'pending': 'badge-warning',
      'canceled': 'badge-error',
      'rejected': 'badge-error',
      'draft': 'badge-gray',
    };
    
    return (
      <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'badge-gray'}`}>
        {status}
      </span>
    );
  };

  return (
    <AuthGuard>
      <Head>
        <title>Siparişlerim - Tyrex B2B</title>
        <meta name="description" content="Siparişlerinizi görüntüleyin ve takip edin" />
      </Head>

      <Layout title="Siparişlerim">
        <SubscriptionGuard 
          requiredPermission="full_dashboard"
          fallbackMessage="Sipariş yönetimi özelliğine erişmek için 4500₺ premium paket gereklidir."
        >
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error">
              <div className="flex">
                <AlertCircle className="h-5 w-5" />
                <div className="ml-3">
                  <p>{error}</p>
                  <button 
                    onClick={loadOrders}
                    className="text-sm underline hover:no-underline mt-1"
                  >
                    Tekrar dene
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="card">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Sipariş numarası ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="form-input pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="pending">Beklemede</option>
                    <option value="confirmed">Onaylandı</option>
                    <option value="processing">İşleniyor</option>
                    <option value="shipped">Kargoda</option>
                    <option value="delivered">Teslim Edildi</option>
                    <option value="canceled">İptal Edildi</option>
                  </select>
                  <button 
                    onClick={handleSearch}
                    className="btn btn-primary"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Stats Cards */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                      <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
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
                        {orders.filter(order => 
                          new Date(order.order_date).getMonth() === new Date().getMonth()
                        ).length}
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
                        {formatCurrency(orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders List */}
          {!isLoading && !error && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Siparişler</h3>
              </div>
              <div className="card-body p-0">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Henüz sipariş bulunmuyor
                    </h3>
                    <p className="text-gray-600">
                      İlk siparişinizi vermek için pazaryerini ziyaret edebilirsiniz.
                    </p>
                  </div>
                ) : (
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
                            Ürün Sayısı
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Toplam
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order.order_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(new Date(order.order_date))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.wholesaler_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.total_items || 0} ürün
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(parseFloat(order.total_amount))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/orders/${order.id}`}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                <Eye className="h-4 w-4 inline mr-1" />
                                Detay
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
        </SubscriptionGuard>
      </Layout>
    </AuthGuard>
  );
};

export default OrdersPage;