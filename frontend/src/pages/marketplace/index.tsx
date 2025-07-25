import React from 'react';
import Head from 'next/head';
import { ShoppingCart, Filter, Search } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';

const MarketplacePage: React.FC = () => {
  return (
    <AuthGuard requireMarketplace={true}>
      <Head>
        <title>Pazaryeri - Tyrex B2B</title>
        <meta name="description" content="Lastik pazaryerinde binlerce ürün keşfedin" />
      </Head>

      <Layout title="Pazaryeri">
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Lastik ara... (örn: Michelin 205/55 R16)"
                    className="form-input pl-10"
                  />
                </div>
              </div>
              <button className="btn btn-outline">
                <Filter className="h-5 w-5 mr-2" />
                Filtrele
              </button>
            </div>
          </div>

          {/* Coming Soon Message */}
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Pazaryeri Yakında Açılıyor
              </h3>
              <p className="text-gray-600 mb-6">
                Binlerce lastik çeşidi ve dinamik fiyatlandırma özelliği ile 
                pazaryerimiz çok yakında hizmetinizde olacak.
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h4 className="font-medium text-primary-800 mb-2">
                  Pazaryeri Özellikleri:
                </h4>
                <ul className="text-sm text-primary-700 space-y-1 text-left">
                  <li>✓ 10,000+ lastik çeşidi</li>
                  <li>✓ Gerçek zamanlı fiyat karşılaştırması</li>
                  <li>✓ Toptancıya özel indirimler</li>
                  <li>✓ Hızlı sipariş ve takip</li>
                  <li>✓ Stok durumu kontrolü</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default MarketplacePage;