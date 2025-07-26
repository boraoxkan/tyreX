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
  console.log('🔄 ProductsPage rendering...');

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

  // Debug console logs
  console.log('🔐 Auth state:', {
    user: !!user,
    subscription: !!subscription,
    hasMarketplaceAccess,
    authState: !!authState
  });
  
  console.log('🛒 Cart state:', {
    totalItems,
    cartState: !!cartState,
    addItem: !!addItem
  });

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

  // GEÇICI BYPASS - Debug için marketplace access'i zorla true yapın
  const debugHasMarketplaceAccess = true; // ⚠️ GEÇICI - Production'da kaldırın!
  
  console.log('🔧 Debug marketplace access:', {
    original: hasMarketplaceAccess,
    debug: debugHasMarketplaceAccess,
    willLoadProducts: debugHasMarketplaceAccess
  });

  // Load products and stats - GEÇICI BYPASS ile
  useEffect(() => {
    console.log('📡 useEffect triggered:', {
      debugHasMarketplaceAccess,
      filters,
      authState: !!authState
    });
    
    if (debugHasMarketplaceAccess) { // hasMarketplaceAccess yerine geçici
      console.log('✅ Loading products and stats...');
      loadProducts();
      loadStats();
    } else {
      console.log('❌ No marketplace access, skipping API calls');
    }
  }, [debugHasMarketplaceAccess, filters]); // hasMarketplaceAccess yerine geçici

  // frontend/src/pages/dashboard/products.tsx içindeki loadProducts fonksiyonunu şöyle değiştirin:

  const loadProducts = async () => {
    try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Loading products with filters:', filters);
        
        const response = await marketApi.getProducts(filters);
        
        console.log('📡 API Response:', response);
        console.log('📦 Raw response type:', typeof response);
        console.log('📦 Is response array:', Array.isArray(response));
        
        // Backend direkt array döndürüyor, results wrapper yok
        let productsData: MarketProduct[] = [];
        
        if (Array.isArray(response)) {
        // Direkt array geliyorsa
        productsData = response;
        console.log('✅ Direct array received, products count:', response.length);
        } else if (response && response.results && Array.isArray(response.results)) {
        // Paginated response geliyorsa
        productsData = response.results;
        console.log('✅ Paginated response received, products count:', response.results.length);
        } else {
        // Hiçbiri değilse
        productsData = [];
        console.log('⚠️ Unknown response format, setting empty array');
        console.log('⚠️ Response keys:', response ? Object.keys(response) : 'null');
        }
        
        setProducts(productsData);
        console.log('✅ Products set successfully:', productsData.length, 'items');
        
        // İlk ürünü debug için logla
        if (productsData.length > 0) {
        console.log('🔍 First product sample:', {
            id: productsData[0].id,
            name: productsData[0].name,
            sku: productsData[0].sku,
            final_price: productsData[0].final_price,
            available_stock: productsData[0].available_stock
        });
        }
        
    } catch (err: any) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        setProducts([]);
        console.error('❌ Failed to load products:', err);
        console.error('❌ Error details:', errorMessage);
    } finally {
        setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('📊 Loading marketplace stats...');
      const statsData = await marketApi.getStats();
      setStats(statsData);
      console.log('✅ Stats loaded:', statsData);
    } catch (err: any) {
      console.error('❌ Failed to load stats:', handleApiError(err));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 Search triggered:', searchTerm);
    setFilters(prev => ({ ...prev, search: searchTerm || undefined }));
  };

  const handleFilterChange = (key: keyof MarketFilter, value: any) => {
    console.log('🔧 Filter changed:', key, '=', value);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAddToCart = async (product: MarketProduct) => {
    try {
      console.log('🛒 Adding to cart:', product.name);
      setAddingToCart(product.id);
      
      if (addItem) {
        addItem(product, 1);
        console.log('✅ Added to cart successfully');
      } else {
        console.error('❌ addItem function not available');
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
  //         <title>Pazaryeri - Tyrex B2B</title>
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
        <title>Pazaryeri - Tyrex B2B</title>
        <meta name="description" content="B2B pazaryerinde binlerce ürün keşfedin" />
      </Head>

      <Layout title="Pazaryeri">
        <div className="space-y-6">
          {/* Debug Info - GEÇICI */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Debug Info (Geçici):</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>✅ Component rendered successfully</li>
              <li>✅ Auth state loaded: {user ? 'Yes' : 'No'}</li>
              <li>✅ Cart state loaded: {!!cartState ? 'Yes' : 'No'}</li>
              <li>✅ Products count: {products.length}</li>
              <li>✅ Loading: {loading ? 'Yes' : 'No'}</li>
              <li>✅ Error: {error || 'None'}</li>
            </ul>
          </div>

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

          {/* Products Grid */}
          {!loading && !error && (
            <>
              {products && products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="card hover:shadow-lg transition-shadow duration-200">
                      <div className="card-body">
                        {/* Product Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                              {product.name}
                            </h3>
                            {product.brand && (
                              <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                            )}
                            <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                          </div>
                          
                          {product.is_known_wholesaler && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Anlaşmalı
                            </span>
                          )}
                        </div>

                        {/* Wholesaler Info */}
                        {product.wholesaler_info && (
                          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">
                              <Users className="h-3 w-3 inline mr-1" />
                              {product.wholesaler_info.name}
                            </p>
                          </div>
                        )}

                        {/* Stock Info */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center text-xs text-gray-600">
                            <span>Stok: {product.available_stock} adet</span>
                            {product.available_stock > 0 ? (
                              <span className="text-green-600 font-medium">Mevcut</span>
                            ) : (
                              <span className="text-red-600 font-medium">Tükendi</span>
                            )}
                          </div>
                        </div>

                        {/* Price Info */}
                        <div className="mb-4">
                          {product.base_price && product.final_price && (
                            <div className="space-y-1">
                              {product.discount_percentage > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500 line-through">
                                    {formatPrice(product.base_price)}
                                  </span>
                                  {getDiscountBadge(product.discount_percentage)}
                                </div>
                              )}
                              <div className="text-lg font-semibold text-gray-900">
                                {formatPrice(product.final_price)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Product Attributes */}
                        {product.attributes && product.attributes.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs text-gray-600 space-y-1">
                              {product.attributes.slice(0, 2).map((attr, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{attr.name}:</span>
                                  <span className="font-medium">
                                    {attr.value} {attr.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.available_stock <= 0 || addingToCart === product.id}
                          className={`btn w-full ${
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
                      </div>
                    </div>
                  ))}
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