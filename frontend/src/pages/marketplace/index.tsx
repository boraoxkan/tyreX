import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ShoppingCart, Filter, Search, Package, TrendingUp, Users, Star } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { marketApi, MarketProduct, MarketplaceStats } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const MarketplacePage: React.FC = () => {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load marketplace data
      const [productsResult, statsResult] = await Promise.allSettled([
        marketApi.getProducts(),
        marketApi.getStats()
      ]);

      if (productsResult.status === 'fulfilled') {
        setProducts(productsResult.value.results);
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      }

    } catch (err: any) {
      console.error('Failed to load marketplace data:', err);
      setError('Pazaryeri verileri yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', searchTerm);
  };

  return (
    <AuthGuard>
      <Head>
        <title>Pazaryeri - tyreX</title>
        <meta name="description" content="Lastik pazaryerinde binlerce ürün keşfedin" />
      </Head>

      <Layout title="Pazaryeri">
        <SubscriptionGuard 
          requiredPermission="marketplace"
          fallbackMessage="Pazaryeri erişimi için temel abonelik gereklidir."
        >
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="form-input pl-10"
                  />
                </div>
              </div>
              <button 
                onClick={handleSearch}
                className="btn btn-outline"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filtrele
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Pazaryeri Şu Anda Kullanılamıyor
                </h3>
                <p className="text-gray-600 mb-6">
                  {error}
                </p>
                <button 
                  onClick={loadMarketplaceData}
                  className="btn btn-primary"
                >
                  Tekrar Dene
                </button>
              </div>
            </div>
          )}

          {/* Marketplace Stats */}
          {!isLoading && !error && stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.total_products.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Toptancı Sayısı</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.total_wholesalers}</p>
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
                      <p className="text-sm font-medium text-gray-600">Ortalama İndirim</p>
                      <p className="text-2xl font-semibold text-gray-900">%{stats.average_discount}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Stokta Ürün</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.products_in_stock.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid or Coming Soon */}
          {!isLoading && !error && (
            products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.slice(0, 12).map((product) => (
                  <div key={product.id} className="card hover:shadow-lg transition-shadow">
                    <div className="card-body">
                      <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                      <p className="text-xs text-gray-500 mb-3">{product.sku}</p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(parseFloat(product.final_price || '0'))}
                        </span>
                        {product.discount_percentage > 0 && (
                          <span className="badge badge-success">
                            %{product.discount_percentage} İndirim
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                        <span>Stok: {product.available_stock}</span>
                        <span>{product.wholesaler_info?.name || 'Toptancı'}</span>
                      </div>

                      <button className="btn btn-primary w-full">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Sepete Ekle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
                      <li>✓ Dinamik fiyatlandırma</li>
                      <li>✓ Otomatik stok takibi</li>
                      <li>✓ Güvenilir toptancılar</li>
                    </ul>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
        </SubscriptionGuard>
      </Layout>
    </AuthGuard>
  );
};

export default MarketplacePage;