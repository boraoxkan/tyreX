// frontend/src/pages/dashboard/my-warehouses.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Warehouse, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail,
  Package,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/store/authStore';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { inventoryApi } from '@/lib/api';

interface WarehouseData {
  id: number;
  name: string;
  code: string;
  company_name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  total_area?: string;
  storage_capacity: number;
  warehouse_type: string;
  is_active: boolean;
  total_products: number;
  total_stock_value: string;
  created_at: string;
}

interface WarehouseFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  manager_name: string;
  total_area: string;
  storage_capacity: string;
  warehouse_type: string;
  is_active: boolean;
}

const MyWarehousesPage: React.FC = () => {
  const { user, company } = useAuth();
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<WarehouseFormData>({
    name: '',
    code: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    manager_name: '',
    total_area: '',
    storage_capacity: '',
    warehouse_type: 'main',
    is_active: true
  });

  const warehouseTypes = [
    { value: 'main', label: 'Ana Depo' },
    { value: 'distribution', label: 'Dağıtım Merkezi' },
    { value: 'retail', label: 'Mağaza Deposu' },
    { value: 'virtual', label: 'Sanal Depo' }
  ];

  // Load warehouses
  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await inventoryApi.getWarehouses();
      const warehousesData = response.results || response;
      setWarehouses(warehousesData);
    } catch (error: any) {
      console.error('Failed to load warehouses:', error);
      setError('Depolar yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWarehouse = () => {
    setEditingWarehouse(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      postal_code: '',
      phone: '',
      email: '',
      manager_name: '',
      total_area: '',
      storage_capacity: '',
      warehouse_type: 'main',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEditWarehouse = (warehouse: WarehouseData) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || '',
      city: warehouse.city || '',
      postal_code: warehouse.postal_code || '',
      phone: warehouse.phone || '',
      email: warehouse.email || '',
      manager_name: warehouse.manager_name || '',
      total_area: warehouse.total_area || '',
      storage_capacity: warehouse.storage_capacity.toString(),
      warehouse_type: warehouse.warehouse_type,
      is_active: warehouse.is_active
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);

      const submitData = {
        ...formData,
        total_area: formData.total_area ? parseFloat(formData.total_area) : null,
        storage_capacity: parseInt(formData.storage_capacity) || 0
      };

      if (editingWarehouse) {
        // Update existing warehouse
        await inventoryApi.updateWarehouse(editingWarehouse.id, submitData);
      } else {
        // Create new warehouse
        await inventoryApi.createWarehouse(submitData);
      }

      setShowModal(false);
      await loadWarehouses();
    } catch (error: any) {
      console.error('Failed to save warehouse:', error);
      
      if (error.response?.data?.details) {
        const errorMessages = Object.values(error.response.data.details).flat();
        setError(errorMessages[0] as string);
      } else {
        setError(error.response?.data?.error || 'Depo kaydedilirken hata oluştu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWarehouse = async (warehouse: WarehouseData) => {
    if (!confirm(`"${warehouse.name}" deposunu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setError(null);
      await inventoryApi.deleteWarehouse(warehouse.id);
      await loadWarehouses();
    } catch (error: any) {
      console.error('Failed to delete warehouse:', error);
      setError(error.response?.data?.error || 'Depo silinirken hata oluştu.');
    }
  };

  const getWarehouseTypeLabel = (type: string) => {
    const typeObj = warehouseTypes.find(t => t.value === type);
    return typeObj?.label || type;
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <Layout title="Depolarım">
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
        <title>Depolarım - tyreX</title>
        <meta name="description" content="Depolarınızı yönetin" />
      </Head>

      <Layout title="Depolarım">
        <SubscriptionGuard 
          requiredPermission="inventory_management"
          fallbackMessage="Depo yönetimi özelliğine erişmek için PRO aboneliği gereklidir."
        >
        <div className="space-y-6">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Depolarım</h1>
              <p className="text-gray-600">
                {company?.name} şirketine ait depolar
              </p>
            </div>
            <button
              onClick={handleAddWarehouse}
              className="btn btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Yeni Depo Ekle
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error">
              <div className="flex">
                <AlertCircle className="h-5 w-5" />
                <div className="ml-3">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warehouses Grid */}
          {warehouses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warehouses.map((warehouse) => (
                <div key={warehouse.id} className="card">
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Warehouse className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900">
                            {warehouse.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {warehouse.code}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditWarehouse(warehouse)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWarehouse(warehouse)}
                          className="p-1 text-gray-400 hover:text-error-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Warehouse Info */}
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          warehouse.is_active 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {warehouse.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {getWarehouseTypeLabel(warehouse.warehouse_type)}
                        </span>
                      </div>

                      {warehouse.address && (
                        <div className="flex items-start text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{warehouse.address}</span>
                        </div>
                      )}

                      {warehouse.city && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{warehouse.city}</span>
                          {warehouse.postal_code && (
                            <span className="ml-2">{warehouse.postal_code}</span>
                          )}
                        </div>
                      )}

                      {warehouse.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{warehouse.phone}</span>
                        </div>
                      )}

                      {warehouse.manager_name && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Sorumlu: </span>
                          {warehouse.manager_name}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {warehouse.total_products}
                          </p>
                          <p className="text-xs text-gray-500">Ürün Çeşidi</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(parseFloat(warehouse.total_stock_value))}
                          </p>
                          <p className="text-xs text-gray-500">Stok Değeri</p>
                        </div>
                      </div>

                      {warehouse.storage_capacity > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Kapasite</span>
                            <span>{formatNumber(warehouse.storage_capacity)} adet</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <Warehouse className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Henüz depo eklenmemiş
                </h3>
                <p className="text-gray-600 mb-6">
                  İlk deponuzu ekleyerek stok yönetimine başlayın.
                </p>
                <button
                  onClick={handleAddWarehouse}
                  className="btn btn-primary"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  İlk Depomu Ekle
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
                      {editingWarehouse ? 'Depo Düzenle' : 'Yeni Depo Ekle'}
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
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Depo Adı *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="form-input"
                        placeholder="Ana Depo"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Depo Kodu *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="form-input"
                        placeholder="WH001"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Depo Türü</label>
                      <select
                        value={formData.warehouse_type}
                        onChange={(e) => setFormData({ ...formData, warehouse_type: e.target.value })}
                        className="form-input"
                      >
                        {warehouseTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Depolama Kapasitesi</label>
                      <input
                        type="number"
                        value={formData.storage_capacity}
                        onChange={(e) => setFormData({ ...formData, storage_capacity: e.target.value })}
                        className="form-input"
                        placeholder="1000"
                        min="0"
                      />
                      <p className="form-help">Maksimum ürün adedi</p>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Konum Bilgileri</h4>
                    
                    <div>
                      <label className="form-label">Adres</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="form-input"
                        rows={3}
                        placeholder="Depo adresi..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Şehir</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="form-input"
                          placeholder="İstanbul"
                        />
                      </div>

                      <div>
                        <label className="form-label">Posta Kodu</label>
                        <input
                          type="text"
                          value={formData.postal_code}
                          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                          className="form-input"
                          placeholder="34000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">İletişim Bilgileri</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Telefon</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="form-input"
                          placeholder="0212 123 45 67"
                        />
                      </div>

                      <div>
                        <label className="form-label">E-posta</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="form-input"
                          placeholder="depo@sirket.com"
                        />
                      </div>

                      <div>
                        <label className="form-label">Sorumlu Adı</label>
                        <input
                          type="text"
                          value={formData.manager_name}
                          onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                          className="form-input"
                          placeholder="Ahmet Yılmaz"
                        />
                      </div>

                      <div>
                        <label className="form-label">Toplam Alan (m²)</label>
                        <input
                          type="number"
                          value={formData.total_area}
                          onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                          className="form-input"
                          placeholder="2500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Depo aktif
                    </label>
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
                      ) : editingWarehouse ? (
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

export default MyWarehousesPage;