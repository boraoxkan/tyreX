// frontend/src/pages/dashboard/my-stock.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  X,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/store/authStore';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { inventoryApi } from '@/lib/api';

interface WarehouseOption {
  id: number;
  name: string;
  code: string;
}

interface ProductOption {
  id: number;
  name: string;
  sku: string;
  brand?: string;
  category_name?: string;
}

interface StockItem {
  id: number;
  product: number;
  product_details: {
    id: number;
    name: string;
    sku: string;
    brand?: string;
    category_name?: string;
  };
  warehouse: number;
  warehouse_name: string;
  warehouse_code: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  minimum_stock: number;
  maximum_stock?: number;
  cost_price?: string;
  sale_price?: string;
  location_code?: string;
  lot_number?: string;
  stock_status: string;
  stock_status_display: string;
  total_value: string;
  is_active: boolean;
  is_sellable: boolean;
}

interface StockFormData {
  product: string;
  warehouse: string;
  quantity: string;
  minimum_stock: string;
  maximum_stock: string;
  cost_price: string;
  sale_price: string;
  location_code: string;
  lot_number: string;
  is_active: boolean;
  is_sellable: boolean;
}

const MyStockPage: React.FC = () => {
  const { company } = useAuth();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<StockFormData>({
    product: '',
    warehouse: '',
    quantity: '',
    minimum_stock: '10',
    maximum_stock: '',
    cost_price: '',
    sale_price: '',
    location_code: '',
    lot_number: '',
    is_active: true,
    is_sellable: true
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load stock items when warehouse changes
  useEffect(() => {
    if (warehouses.length > 0) {
      loadStockItems();
    }
  }, [selectedWarehouse, statusFilter]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load warehouses
      const warehousesResponse = await inventoryApi.getWarehouses();
      const warehousesData = warehousesResponse.results || warehousesResponse;
      setWarehouses(warehousesData);

      // Set first warehouse as selected if not already set
      if (warehousesData.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(warehousesData[0].id.toString());
      }

      // Load products (mock data for now - in real app would come from API)
      const mockProducts: ProductOption[] = [
        { id: 1, name: 'Pirelli P Zero 225/45 R17', sku: 'PIR-PZERO-225-45-17', brand: 'Pirelli', category_name: 'Yaz Lastikleri' },
        { id: 2, name: 'Michelin Pilot Sport 4 225/45 R17', sku: 'MIC-PS4-225-45-17', brand: 'Michelin', category_name: 'Yaz Lastikleri' },
        { id: 3, name: 'Continental WinterContact 195/65 R15', sku: 'CON-WC-195-65-15', brand: 'Continental', category_name: 'Kış Lastikleri' },
        { id: 4, name: 'Goodyear Vector 4Seasons 215/60 R16', sku: 'GOO-VEC-215-60-16', brand: 'Goodyear', category_name: '4 Mevsim Lastikleri' },
        { id: 5, name: 'Bridgestone Duravis 315/80 R22.5', sku: 'BRI-DUR-315-80-22', brand: 'Bridgestone', category_name: 'Kamyon Lastikleri' }
      ];
      setProducts(mockProducts);

    } catch (error: any) {
      console.error('Failed to load initial data:', error);
      setError('Veriler yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStockItems = async () => {
    try {
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedWarehouse) {
        params.append('warehouse', selectedWarehouse);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await inventoryApi.getStockItems(params);
      const stockItemsData = response.results || response;
      setStockItems(stockItemsData);
    } catch (error: any) {
      console.error('Failed to load stock items:', error);
      setError('Stok kalemleri yüklenirken hata oluştu.');
      setStockItems([]);
    }
  };

  const handleAddStock = () => {
    setEditingStock(null);
    setFormData({
      product: '',
      warehouse: selectedWarehouse,
      quantity: '',
      minimum_stock: '10',
      maximum_stock: '',
      cost_price: '',
      sale_price: '',
      location_code: '',
      lot_number: '',
      is_active: true,
      is_sellable: true
    });
    setShowModal(true);
  };

  const handleEditStock = (stock: StockItem) => {
    setEditingStock(stock);
    setFormData({
      product: stock.product.toString(),
      warehouse: stock.warehouse.toString(),
      quantity: stock.quantity.toString(),
      minimum_stock: stock.minimum_stock.toString(),
      maximum_stock: stock.maximum_stock?.toString() || '',
      cost_price: stock.cost_price || '',
      sale_price: stock.sale_price || '',
      location_code: stock.location_code || '',
      lot_number: stock.lot_number || '',
      is_active: stock.is_active,
      is_sellable: stock.is_sellable
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);

      const submitData = {
        product: parseInt(formData.product),
        warehouse: parseInt(formData.warehouse),
        quantity: parseInt(formData.quantity) || 0,
        minimum_stock: parseInt(formData.minimum_stock) || 0,
        maximum_stock: formData.maximum_stock ? parseInt(formData.maximum_stock) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        location_code: formData.location_code || null,
        lot_number: formData.lot_number || null,
        is_active: formData.is_active,
        is_sellable: formData.is_sellable
      };

      if (editingStock) {
        // Update existing stock item
        await inventoryApi.updateStockItem(editingStock.id, submitData);
      } else {
        // Create new stock item
        await inventoryApi.createStockItem(submitData);
      }

      setShowModal(false);
      await loadStockItems();
    } catch (error: any) {
      console.error('Failed to save stock item:', error);
      
      if (error.response?.data?.details) {
        const errorMessages = Object.values(error.response.data.details).flat();
        setError(errorMessages[0] as string);
      } else {
        setError(error.response?.data?.error || 'Stok kalemi kaydedilirken hata oluştu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStock = async (stock: StockItem) => {
    if (!confirm(`"${stock.product_details.name}" stok kalemini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setError(null);
      await inventoryApi.deleteStockItem(stock.id);
      await loadStockItems();
    } catch (error: any) {
      console.error('Failed to delete stock item:', error);
      setError(error.response?.data?.error || 'Stok kalemi silinirken hata oluştu.');
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'low_stock':
        return <AlertTriangle className="h-5 w-5 text-warning-500" />;
      case 'out_of_stock':
        return <TrendingDown className="h-5 w-5 text-error-500" />;
      case 'overstocked':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-success-500" />;
    }
  };

  const getStockStatusBadge = (status: string, statusDisplay: string) => {
    const statusClasses = {
      'low_stock': 'badge-warning',
      'out_of_stock': 'badge-error',
      'overstocked': 'badge-primary',
      'normal': 'badge-success'
    };
    
    return (
      <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'badge-gray'}`}>
        {statusDisplay}
      </span>
    );
  };

  const filteredStockItems = (Array.isArray(stockItems) ? stockItems : []).filter(item =>
    item.product_details.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_details.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.product_details.brand && item.product_details.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <AuthGuard>
        <Layout title="Stok Yönetimi">
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
        <title>Stok Yönetimi - Tyrex B2B</title>
        <meta name="description" content="Stok kalemlerinizi yönetin" />
      </Head>

      <Layout title="Stok Yönetimi">
        <SubscriptionGuard 
          requiredPermission="full_dashboard"
          fallbackMessage="Stok yönetimi özelliğine erişmek için 4500₺ premium paket gereklidir."
        >
        <div className="space-y-6">
          {/* Header with Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stok Yönetimi</h1>
              <p className="text-gray-600">
                {company?.name} - Stok kalemlerinizi yönetin
              </p>
            </div>
            <button
              onClick={handleAddStock}
              className="btn btn-primary"
              disabled={warehouses.length === 0}
            >
              <Plus className="h-5 w-5 mr-2" />
              Stok Ekle
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error">
              <div className="flex">
                <AlertTriangle className="h-5 w-5" />
                <div className="ml-3">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Depo Seçin</label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Tüm Depolar</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Stok Durumu</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="normal">Normal</option>
                    <option value="low">Düşük Stok</option>
                    <option value="out">Stokta Yok</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Ürün Ara</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Ürün adı, SKU veya marka ile ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-input pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Items */}
          {warehouses.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Önce bir depo eklemeniz gerekiyor
                </h3>
                <p className="text-gray-600 mb-6">
                  Stok yönetimi için önce en az bir depo oluşturmalısınız.
                </p>
                <a href="/dashboard/my-warehouses" className="btn btn-primary">
                  Depo Ekle
                </a>
              </div>
            </div>
          ) : filteredStockItems.length > 0 ? (
            <div className="card">
              <div className="card-body p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ürün
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Depo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stok
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fiyat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lokasyon
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStockItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.product_details.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.product_details.sku}
                                {item.product_details.brand && (
                                  <span className="ml-2">• {item.product_details.brand}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.warehouse_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.warehouse_code}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {formatNumber(item.quantity)} adet
                              </div>
                              <div className="text-gray-500">
                                Müsait: {formatNumber(item.available_quantity)}
                              </div>
                              {item.reserved_quantity > 0 && (
                                <div className="text-warning-600 text-xs">
                                  Rezerve: {formatNumber(item.reserved_quantity)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStockStatusIcon(item.stock_status)}
                              <div className="ml-2">
                                {getStockStatusBadge(item.stock_status, item.stock_status_display)}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Min: {item.minimum_stock}
                              {item.maximum_stock && ` • Max: ${item.maximum_stock}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              {item.sale_price && (
                                <div className="font-medium text-gray-900">
                                  {formatCurrency(parseFloat(item.sale_price))}
                                </div>
                              )}
                              {item.cost_price && (
                                <div className="text-gray-500">
                                  Maliyet: {formatCurrency(parseFloat(item.cost_price))}
                                </div>
                              )}
                              {item.total_value && (
                                <div className="text-xs text-gray-500">
                                  Toplam: {formatCurrency(parseFloat(item.total_value))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.location_code || '-'}
                            {item.lot_number && (
                              <div className="text-xs">Lot: {item.lot_number}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditStock(item)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Düzenle"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStock(item)}
                                className="text-error-600 hover:text-error-900"
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
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
              <div className="max-w-md mx-auto">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {searchTerm || selectedWarehouse 
                    ? 'Arama kriterlerinize uygun stok bulunamadı'
                    : 'Henüz stok kalemi eklenmemiş'
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedWarehouse
                    ? 'Farklı kriterlerle arama yapabilir veya yeni stok ekleyebilirsiniz.'
                    : 'İlk stok kaleminizi ekleyerek başlayın.'
                  }
                </p>
                <button
                  onClick={handleAddStock}
                  className="btn btn-primary"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Stok Ekle
                </button>
              </div>
            </div>
          )}

          {/* Add/Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingStock ? 'Stok Kalemi Düzenle' : 'Yeni Stok Kalemi Ekle'}
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="px-6 py-4 space-y-4">
                  {/* Product and Warehouse Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Ürün *</label>
                      <select
                        value={formData.product}
                        onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                        className="form-input"
                        required
                        disabled={!!editingStock}
                      >
                        <option value="">Ürün seçin...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                      {editingStock && (
                        <p className="form-help">Mevcut stok için ürün değiştirilemez</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Depo *</label>
                      <select
                        value={formData.warehouse}
                        onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                        className="form-input"
                        required
                        disabled={!!editingStock}
                      >
                        <option value="">Depo seçin...</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} ({warehouse.code})
                          </option>
                        ))}
                      </select>
                      {editingStock && (
                        <p className="form-help">Mevcut stok için depo değiştirilemez</p>
                      )}
                    </div>
                  </div>

                  {/* Stock Quantities */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Miktar *</label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="form-input"
                        placeholder="100"
                        min="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Minimum Stok</label>
                      <input
                        type="number"
                        value={formData.minimum_stock}
                        onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                        className="form-input"
                        placeholder="10"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="form-label">Maksimum Stok</label>
                      <input
                        type="number"
                        value={formData.maximum_stock}
                        onChange={(e) => setFormData({ ...formData, maximum_stock: e.target.value })}
                        className="form-input"
                        placeholder="1000"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Maliyet Fiyatı (₺)</label>
                      <input
                        type="number"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                        className="form-input"
                        placeholder="500.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="form-label">Satış Fiyatı (₺)</label>
                      <input
                        type="number"
                        value={formData.sale_price}
                        onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                        className="form-input"
                        placeholder="750.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Location and Lot */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Lokasyon Kodu</label>
                      <input
                        type="text"
                        value={formData.location_code}
                        onChange={(e) => setFormData({ ...formData, location_code: e.target.value })}
                        className="form-input"
                        placeholder="A1-B2"
                      />
                    </div>

                    <div>
                      <label className="form-label">Lot/Parti Numarası</label>
                      <input
                        type="text"
                        value={formData.lot_number}
                        onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                        className="form-input"
                        placeholder="LOT2024001"
                      />
                    </div>
                  </div>

                  {/* Status Checkboxes */}
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="is_active"
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                        Stok kalemi aktif
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="is_sellable"
                        type="checkbox"
                        checked={formData.is_sellable}
                        onChange={(e) => setFormData({ ...formData, is_sellable: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_sellable" className="ml-2 block text-sm text-gray-900">
                        Satılabilir
                      </label>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn btn-secondary"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" color="white" className="mr-2" />
                          Kaydediliyor...
                        </>
                      ) : editingStock ? (
                        'Güncelle'
                      ) : (
                        'Ekle'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        </SubscriptionGuard>
      </Layout>
    </AuthGuard>
  );
};

export default MyStockPage;