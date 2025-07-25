import React from 'react';
import Head from 'next/head';
import { BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';

const ReportsPage: React.FC = () => {
  return (
    <AuthGuard>
      <Head>
        <title>Raporlar - Tyrex B2B</title>
        <meta name="description" content="Satış raporlarınızı görüntüleyin ve analiz edin" />
      </Head>

      <Layout title="Raporlar">
        <div className="space-y-6">
          {/* Report Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Satış Analizi</h3>
                    <p className="text-sm text-gray-600">Aylık ve yıllık satış trendleri</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Kar Analizi</h3>
                    <p className="text-sm text-gray-600">Karlılık ve maliyet analizi</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Dönemsel Rapor</h3>
                    <p className="text-sm text-gray-600">Özel tarih aralığı raporları</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="card-body text-center">
                <p className="text-2xl font-bold text-gray-900">₺45,750</p>
                <p className="text-sm text-gray-600">Bu Ay Satış</p>
                <p className="text-xs text-green-600 mt-1">+12.5% artış</p>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-sm text-gray-600">Sipariş Sayısı</p>
                <p className="text-xs text-green-600 mt-1">+8.3% artış</p>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <p className="text-2xl font-bold text-gray-900">₺3,812</p>
                <p className="text-sm text-gray-600">Ortalama Sipariş</p>
                <p className="text-xs text-blue-600 mt-1">+3.2% artış</p>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-sm text-gray-600">Aktif Toptancı</p>
                <p className="text-xs text-gray-600 mt-1">Değişiklik yok</p>
              </div>
            </div>
          </div>

          {/* Report Generation */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Rapor Oluştur</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="form-label">Rapor Türü</label>
                  <select className="form-input">
                    <option>Satış Raporu</option>
                    <option>Kar Analizi</option>
                    <option>Toptancı Performansı</option>
                    <option>Ürün Performansı</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Başlangıç Tarihi</label>
                  <input type="date" className="form-input" />
                </div>

                <div>
                  <label className="form-label">Bitiş Tarihi</label>
                  <input type="date" className="form-input" />
                </div>
              </div>

              <div className="flex gap-4">
                <button className="btn btn-primary">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Rapor Oluştur
                </button>
                <button className="btn btn-outline">
                  <Download className="h-5 w-5 mr-2" />
                  Excel İndir
                </button>
              </div>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Gelişmiş Raporlar Yakında
              </h3>
              <p className="text-gray-600 mb-6">
                Detaylı analitik raporlar ve görselleştirmeler çok yakında 
                hizmetinizde olacak.
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h4 className="font-medium text-primary-800 mb-2">
                  Gelecek Özellikler:
                </h4>
                <ul className="text-sm text-primary-700 space-y-1 text-left">
                  <li>✓ İnteraktif grafikler</li>
                  <li>✓ Otomatik rapor planlaması</li>
                  <li>✓ E-posta rapor gönderimi</li>
                  <li>✓ Özelleştirilebilir dashboard</li>
                  <li>✓ Tahmin ve trend analizi</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default ReportsPage;