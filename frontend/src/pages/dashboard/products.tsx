// frontend/src/pages/dashboard/products.tsx - Debug ve geçici bypass düzeltmesi

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Star, 
  Tag, 
  TrendingUp,
  Package,
  Users,
  DollarSign,
  AlertCircle,
  Plus,
  Minus,
  CheckCircle
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/store/authStore';
import { useCart, useCartActions } from '@/store/cartStore';
import { marketApi, MarketProduct, MarketFilter, MarketplaceStats, handleApiError } from '@/lib/api';

const ProductsPage: React.FC = () => {

  // Auth and cart state with error handling
  const authState = useAuth();
  const cartState = useCart();
  const cartActions = useCartActions();
  
  // Safe destructuring with fallbacks
  const {
    user = null,
    subscription = null,
    hasMarketplaceAccess = false // Güvenli fallback
  } = authState || {};
  
  const { totalItems = 0 } = cartState || {};
  const { addItem } = cartActions || {};

  // Component state
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<MarketFilter>({
    in_stock: true,
    ordering: '-created_at'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  // Load products and stats
  useEffect(() => {
    if (hasMarketplaceAccess) {
      loadProducts();
      loadStats();
    }
  }, [hasMarketplaceAccess, filters]);

  const loadProducts = async () => {
    try {
        setLoading(true);
        setError(null);
        
        const response = await marketApi.getProducts(filters);
        
        // Backend direkt array döndürüyor, results wrapper yok
        let productsData: MarketProduct[] = [];
        
        if (Array.isArray(response)) {
        // Direkt array geliyorsa
        productsData = response;
        } else if (response && response.results && Array.isArray(response.results)) {
        // Paginated response geliyorsa
        productsData = response.results;
        } else {
        // Hiçbiri değilse
        productsData = [];
        }
        
        setProducts(productsData);
        
    } catch (err: any) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        setProducts([]);
    } finally {
        setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await marketApi.getStats();
      setStats(statsData);
    } catch (err: any) {
      // Stats yüklenemezse sessizce geç
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchTerm || undefined }));
  };

  const handleFilterChange = (key: keyof MarketFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAddToCart = async (product: MarketProduct) => {
    try {
      setAddingToCart(product.id);
      
      if (addItem) {
        addItem(product, 1);
      }
      
      // Show success feedback
      setTimeout(() => setAddingToCart(null), 1000);
      
    } catch (err: any) {
      console.error('❌ Failed to add to cart:', err);
      setAddingToCart(null);
    }
  };

  const formatPrice = (price: string | undefined) => {
    if (!price) return 'Fiyat belirtilmemiş';
    return `₺${parseFloat(price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const getDiscountBadge = (discount: number) => {
    if (discount <= 0) return null;
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        %{discount.toFixed(1)} indirim
      </span>
    );
  };

  // If no marketplace access, show subscription message - GEÇICI OLARAK KAPALI
  // if (!debugHasMarketplaceAccess) {
  //   return (
  //     <AuthGuard>
  //       <Head>
  //         <title>Pazaryeri - tyreX</title>
  //       </Head>
  //       <Layout title="Pazaryeri">
  //         <div className="text-center py-20">
  //           {/* Subscription message component */}
  //         </div>
  //       </Layout>
  //     </AuthGuard>
  //   );
  // }

  return (
    <AuthGuard>
      <Head>
        <title>Pazaryeri - tyreX</title>
        <meta name="description" content="B2B pazaryerinde binlerce ürün keşfedin" />
      </Head>

      <Layout title="Pazaryeri">
        <div className="space-y-6">

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {stats.total_products.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Toptancı</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {stats.total_wholesalers}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Tag className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Ortalama İndirim</p>
                      <p className="text-xl font-semibold text-gray-900">
                        %{parseFloat(stats.average_discount).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Tasarruf</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatPrice(stats.your_potential_savings)}
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
                      placeholder="Ürün ara... (örn: Michelin 205/55 R16)"
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

                  {totalItems > 0 && (
                    <Link href="/cart" className="btn btn-success relative">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Sepet
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {totalItems}
                      </span>
                    </Link>
                  )}
                </div>
              </form>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="form-label">Marka</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Marka adı"
                        value={filters.brand || ''}
                        onChange={(e) => handleFilterChange('brand', e.target.value || undefined)}
                      />
                    </div>

                    <div>
                      <label className="form-label">Min Fiyat</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        value={filters.min_price || ''}
                        onChange={(e) => handleFilterChange('min_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>

                    <div>
                      <label className="form-label">Max Fiyat</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="999999"
                        min="0"
                        step="0.01"
                        value={filters.max_price || ''}
                        onChange={(e) => handleFilterChange('max_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>

                    <div>
                      <label className="form-label">Sıralama</label>
                      <select
                        className="form-input"
                        value={filters.ordering || '-created_at'}
                        onChange={(e) => handleFilterChange('ordering', e.target.value)}
                      >
                        <option value="-created_at">Yeniden eskiye</option>
                        <option value="created_at">Eskiden yeniye</option>
                        <option value="name">Ürün adına göre A-Z</option>
                        <option value="-name">Ürün adına göre Z-A</option>
                        <option value="final_price">Fiyata göre artan</option>
                        <option value="-final_price">Fiyata göre azalan</option>
                        <option value="-total_stock">Stok miktarına göre</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox text-primary-600"
                        checked={filters.in_stock !== false}
                        onChange={(e) => handleFilterChange('in_stock', e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-gray-700">Sadece stokta olanlar</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox text-primary-600"
                        checked={filters.known_wholesalers_only || false}
                        onChange={(e) => handleFilterChange('known_wholesalers_only', e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-gray-700">Anlaşmalı toptancılarım</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="spinner h-8 w-8 mx-auto mb-4"></div>
              <p className="text-gray-600">Ürünler yükleniyor...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
              <button 
                onClick={loadProducts}
                className="ml-4 btn btn-sm btn-outline"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Products Table */}
          {!loading && !error && (
            <>
              {products && products.length > 0 ? (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">
                      Ürünler ({products.length})
                    </h3>
                  </div>
                  <div className="card-body p-0">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ürün
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Toptancı
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stok
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fiyat
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlem
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              {/* Ürün Bilgileri */}
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {product.name}
                                    </div>
                                    {product.brand && (
                                      <div className="text-sm text-gray-500">{product.brand}</div>
                                    )}
                                    <div className="text-xs text-gray-400">SKU: {product.sku}</div>
                                    {product.is_known_wholesaler && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Anlaşmalı
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Toptancı */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {product.wholesaler_info ? (
                                    <div>
                                      <div className="flex items-center">
                                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                                        {product.wholesaler_info.name}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </td>
                              
                              {/* Stok */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {product.available_stock} adet
                                </div>
                                <div className="text-xs">
                                  {product.available_stock > 0 ? (
                                    <span className="text-green-600 font-medium">Mevcut</span>
                                  ) : (
                                    <span className="text-red-600 font-medium">Tükendi</span>
                                  )}
                                </div>
                              </td>
                              
                              {/* Fiyat */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatPrice(product.final_price || '0')}
                                </div>
                                {product.base_price && product.final_price && product.discount_percentage > 0 && (
                                  <div className="text-xs text-gray-500">
                                    <span className="line-through mr-2">
                                      {formatPrice(product.base_price)}
                                    </span>
                                    {getDiscountBadge(product.discount_percentage)}
                                  </div>
                                )}
                              </td>
                              
                              {/* İşlem */}
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  disabled={product.available_stock <= 0 || addingToCart === product.id}
                                  className={`btn ${
                                    product.available_stock <= 0 
                                      ? 'btn-secondary cursor-not-allowed' 
                                      : addingToCart === product.id
                                      ? 'btn-success'
                                      : 'btn-primary'
                                  }`}
                                >
                                  {addingToCart === product.id ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Eklendi!
                                    </>
                                  ) : product.available_stock <= 0 ? (
                                    'Stokta Yok'
                                  ) : (
                                    <>
                                      <ShoppingCart className="h-4 w-4 mr-2" />
                                      Sepete Ekle
                                    </>
                                  )}
                                </button>
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
                    Ürün bulunamadı
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Arama kriterlerinize uygun ürün bulunamadı. Filtrelerinizi değiştirmeyi deneyin.
                  </p>
                  <button 
                    onClick={() => {
                      setFilters({ in_stock: true, ordering: '-created_at' });
                      setSearchTerm('');
                    }}
                    className="btn btn-primary"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default ProductsPage;