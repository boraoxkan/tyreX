import React from 'react';
import Head from 'next/head';
import { Package, Calendar, TrendingUp } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';

const OrdersPage: React.FC = () => {
  // Mock data for demonstration
  const orders = [
    {
      id: 'ORD-2024-001',
      date: '2024-01-15',
      wholesaler: 'Premium Lastik A.Ş.',
      total: 12450.00,
      status: 'Teslim Edildi',
      items: 8,
    },
    {
      id: 'ORD-2024-002',
      date: '2024-01-14',
      wholesaler: 'Mega Lastik Ltd.',
      total: 8750.00,
      status: 'Kargoda',
      items: 5,
    },
    {
      id: 'ORD-2024-003',
      date: '2024-01-12',
      wholesaler: 'Premium Lastik A.Ş.',
      total: 15600.00,
      status: 'Hazırlanıyor',
      items: 12,
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Teslim Edildi': 'badge-success',
      'Kargoda': 'badge-warning',
      'Hazırlanıyor': 'badge-primary',
      'İptal Edildi': 'badge-error',
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
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                    <p className="text-2xl font-semibold text-gray-900">12</p>
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
                    <p className="text-2xl font-semibold text-gray-900">3</p>
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
                    <p className="text-2xl font-semibold text-gray-900">₺45,750</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Son Siparişler</h3>
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
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.wholesaler}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.items} ürün
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₺{order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900">
                            Detay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Empty State (if no orders) */}
          {orders.length === 0 && (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Henüz siparişiniz yok
              </h3>
              <p className="text-gray-600 mb-6">
                Pazaryerinden ilk siparişinizi vererek başlayın.
              </p>
              <button className="btn btn-primary">
                Pazaryerine Git
              </button>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default OrdersPage;