import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import api from '@/lib/api';
import { ChevronDown, Filter, Plus, Eye, FileText, DollarSign } from 'lucide-react';

interface StockItem {
  id: number;
  product_details: {
    id: number;
    name: string;
    sku: string;
    brand: string;
    category_id: number;
    category_name: string;
    category_path: string;
    tire_width?: string;
    tire_aspect_ratio?: string;
    tire_diameter?: string;
    battery_ampere?: string;
    battery_voltage?: string;
    rim_size?: string;
    rim_bolt_pattern?: string;
    get_tire_size?: string;
  };
  warehouse_name: string;
  warehouse_code: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  minimum_stock: number;
  maximum_stock: number | null;
  cost_price: string | null;
  sale_price: string | null;
  location_code: string | null;
  barcode: string | null;
  stock_status: string;
  stock_status_display: string;
  total_value: string;
  price_history: any[];
}

interface Warehouse {
  id: number;
  name: string;
  code: string;
  company_name: string;
  total_products: number;
  total_stock_value: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  brand: string;
  category: number;
  category_name: string;
  category_path: string;
  tire_width?: string;
  tire_aspect_ratio?: string;
  tire_diameter?: string;
  battery_ampere?: string;
  rim_size?: string;
  rim_bolt_pattern?: string;
  tire_size?: string;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  full_path: string;
  parent: number | null;
  children: Category[];
}

export default function MyStock() {
  const router = useRouter();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stok ekleme için state'ler
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [locationCode, setLocationCode] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  
  // Lastik özellikleri için state'ler
  const [tireSizes, setTireSizes] = useState<any[]>([]);
  const [selectedTireSize, setSelectedTireSize] = useState<string>('');
  
  // Akü özellikleri için state'ler
  const [batteryCapacities, setBatteryCapacities] = useState<string[]>([]);
  const [selectedBatteryCapacity, setSelectedBatteryCapacity] = useState<string>('');
  
  // Jant özellikleri için state'ler
  const [rimSpecs, setRimSpecs] = useState<{ sizes: string[], bolt_patterns: string[] }>({ sizes: [], bolt_patterns: [] });
  const [selectedRimSize, setSelectedRimSize] = useState<string>('');
  const [selectedBoltPattern, setSelectedBoltPattern] = useState<string>('');
  
  // Filtreleme için state'ler
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<number | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtreleme için marka ve özellik state'leri
  const [filterBrands, setFilterBrands] = useState<string[]>([]);
  const [filterTireSizes, setFilterTireSizes] = useState<any[]>([]);
  const [filterBatteryCapacities, setFilterBatteryCapacities] = useState<string[]>([]);
  const [filterRimSpecs, setFilterRimSpecs] = useState<{ sizes: string[], bolt_patterns: string[] }>({ sizes: [], bolt_patterns: [] });
  
  // Özellik filtreleri için state'ler
  const [selectedTireSizeFilter, setSelectedTireSizeFilter] = useState<string>('');
  const [selectedBatteryCapacityFilter, setSelectedBatteryCapacityFilter] = useState<string>('');
  const [selectedRimSizeFilter, setSelectedRimSizeFilter] = useState<string>('');
  const [selectedBoltPatternFilter, setSelectedBoltPatternFilter] = useState<string>('');

  // Fiyat geçmişi modal
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);

  // Toplu fiyat güncelleme
  const [selectedStockIds, setSelectedStockIds] = useState<number[]>([]);
  const [showBulkPriceUpdate, setShowBulkPriceUpdate] = useState(false);
  const [bulkChangeType, setBulkChangeType] = useState<'increase' | 'decrease'>('increase');
  const [bulkValueType, setBulkValueType] = useState<'percentage' | 'fixed'>('percentage');
  const [bulkValue, setBulkValue] = useState<string>('');
  const [bulkPriceType, setBulkPriceType] = useState<'cost_price' | 'sale_price' | 'both'>('both');
  const [bulkChangeReason, setBulkChangeReason] = useState<string>('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchStockItems();
  }, [selectedWarehouseFilter, selectedCategoryFilter, selectedBrandFilter, selectedTireSizeFilter, selectedBatteryCapacityFilter, selectedRimSizeFilter, selectedBoltPatternFilter, searchQuery]);
  
  useEffect(() => {
    if (selectedCategoryFilter) {
      fetchFilterBrands();
      setSelectedBrandFilter('');
      setSelectedTireSizeFilter('');
      setSelectedBatteryCapacityFilter('');
      setSelectedRimSizeFilter('');
      setSelectedBoltPatternFilter('');
    } else {
      setFilterBrands([]);
      setSelectedBrandFilter('');
    }
  }, [selectedCategoryFilter]);
  
  useEffect(() => {
    if (selectedCategoryFilter && selectedBrandFilter) {
      fetchFilterProductSpecs();
    } else {
      setFilterTireSizes([]);
      setFilterBatteryCapacities([]);
      setFilterRimSpecs({ sizes: [], bolt_patterns: [] });
      setSelectedTireSizeFilter('');
      setSelectedBatteryCapacityFilter('');
      setSelectedRimSizeFilter('');
      setSelectedBoltPatternFilter('');
    }
  }, [selectedCategoryFilter, selectedBrandFilter]);

  useEffect(() => {
    if (selectedCategory) {
      fetchBrands();
      setSelectedBrand('');
      setSelectedProduct(null);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory && selectedBrand) {
      fetchProductSpecs();
      fetchFilteredProducts();
    }
  }, [selectedCategory, selectedBrand]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [warehousesResponse, categoriesResponse] = await Promise.all([
        api.get('/inventory/warehouses/'),
        api.get('/products/categories/tree/')
      ]);
      
      setWarehouses(warehousesResponse.data.results || warehousesResponse.data);
      setCategories(categoriesResponse.data);
      await fetchStockItems();
    } catch (error) {
      console.error('Veri yüklenirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockItems = async () => {
    try {
      let params: any = {};
      
      if (selectedWarehouseFilter) params.warehouse = selectedWarehouseFilter;
      if (selectedCategoryFilter) params.category = selectedCategoryFilter;
      if (selectedBrandFilter) params.brand = selectedBrandFilter;
      if (searchQuery) params.search = searchQuery;
      
      // Lastik özellikleri
      if (selectedTireSizeFilter) {
        const [width, aspectRatio, diameter] = selectedTireSizeFilter.split('/');
        if (width) params.tire_width = width;
        if (aspectRatio) params.tire_aspect_ratio = aspectRatio;
        if (diameter) params.tire_diameter = diameter;
      }
      
      // Akü özellikleri
      if (selectedBatteryCapacityFilter) {
        params.battery_ampere = selectedBatteryCapacityFilter;
      }
      
      // Jant özellikleri
      if (selectedRimSizeFilter) {
        params.rim_size = selectedRimSizeFilter;
      }
      if (selectedBoltPatternFilter) {
        params.rim_bolt_pattern = selectedBoltPatternFilter;
      }
      
      const response = await api.get('/inventory/stock-items/', { params });
      setStockItems(response.data.results || response.data);
    } catch (error) {
      console.error('Stok kalemleri yüklenirken hata oluştu:', error);
    }
  };

  const fetchBrands = async () => {
    if (!selectedCategory) return;
    
    try {
      const response = await api.get('/products/products/brands/', {
        params: { category: selectedCategory }
      });
      setBrands(response.data);
    } catch (error) {
      console.error('Markalar yüklenirken hata oluştu:', error);
    }
  };
  
  const fetchFilterBrands = async () => {
    if (!selectedCategoryFilter) return;
    
    try {
      const response = await api.get('/products/products/brands/', {
        params: { category: selectedCategoryFilter }
      });
      setFilterBrands(response.data);
    } catch (error) {
      console.error('Filtre markaları yüklenirken hata oluştu:', error);
    }
  };
  
  const fetchFilterProductSpecs = async () => {
    if (!selectedCategoryFilter || !selectedBrandFilter) return;

    try {
      const selectedCategoryObj = findCategoryById(selectedCategoryFilter);
      if (!selectedCategoryObj) return;

      // Lastik kategorisi kontrolü
      if (selectedCategoryObj.full_path.includes('Lastik')) {
        const response = await api.get('/products/products/tire_sizes/', {
          params: { category: selectedCategoryFilter, brand: selectedBrandFilter }
        });
        setFilterTireSizes(response.data);
      }
      // Akü kategorisi kontrolü
      else if (selectedCategoryObj.full_path.includes('Akü')) {
        const response = await api.get('/products/products/battery_capacities/', {
          params: { category: selectedCategoryFilter, brand: selectedBrandFilter }
        });
        setFilterBatteryCapacities(response.data);
      }
      // Jant kategorisi kontrolü
      else if (selectedCategoryObj.full_path.includes('Jant')) {
        const response = await api.get('/products/products/rim_specs/', {
          params: { category: selectedCategoryFilter, brand: selectedBrandFilter }
        });
        setFilterRimSpecs(response.data);
      }
    } catch (error) {
      console.error('Filtre ürün özellikleri yüklenirken hata oluştu:', error);
    }
  };

  const fetchProductSpecs = async () => {
    if (!selectedCategory || !selectedBrand) return;

    try {
      const selectedCategoryObj = findCategoryById(selectedCategory);
      if (!selectedCategoryObj) return;

      // Lastik kategorisi kontrolü
      if (selectedCategoryObj.full_path.includes('Lastik')) {
        const response = await api.get('/products/products/tire_sizes/', {
          params: { category: selectedCategory, brand: selectedBrand }
        });
        setTireSizes(response.data);
      }
      // Akü kategorisi kontrolü
      else if (selectedCategoryObj.full_path.includes('Akü')) {
        const response = await api.get('/products/products/battery_capacities/', {
          params: { category: selectedCategory, brand: selectedBrand }
        });
        setBatteryCapacities(response.data);
      }
      // Jant kategorisi kontrolü
      else if (selectedCategoryObj.full_path.includes('Jant')) {
        const response = await api.get('/products/products/rim_specs/', {
          params: { category: selectedCategory, brand: selectedBrand }
        });
        setRimSpecs(response.data);
      }
    } catch (error) {
      console.error('Ürün özellikleri yüklenirken hata oluştu:', error);
    }
  };

  const fetchFilteredProducts = async () => {
    if (!selectedCategory || !selectedBrand) return;

    try {
      let params: any = {
        category: selectedCategory,
        brand: selectedBrand
      };

      // Özellik filtrelerini ekle
      if (selectedTireSize) {
        const [width, aspectRatio, diameter] = selectedTireSize.split('/');
        params.tire_width = width;
        params.tire_aspect_ratio = aspectRatio;
        params.tire_diameter = diameter;
      }

      if (selectedBatteryCapacity) {
        params.battery_ampere = selectedBatteryCapacity;
      }

      if (selectedRimSize) {
        params.rim_size = selectedRimSize;
      }

      if (selectedBoltPattern) {
        params.rim_bolt_pattern = selectedBoltPattern;
      }

      const response = await api.get('/products/products/', { params });
      setProducts(response.data.results || response.data);
    } catch (error) {
      console.error('Ürünler yüklenirken hata oluştu:', error);
    }
  };

  const findCategoryById = (id: number): Category | null => {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.children) {
        for (const child of category.children) {
          if (child.id === id) return child;
          const found = findCategoryInChildren(child, id);
          if (found) return found;
        }
      }
    }
    return null;
  };

  const findCategoryInChildren = (category: Category, id: number): Category | null => {
    if (category.id === id) return category;
    if (category.children) {
      for (const child of category.children) {
        const found = findCategoryInChildren(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleAddStock = async () => {
    if (!selectedWarehouse || !selectedProduct || stockQuantity <= 0) {
      alert('Lütfen tüm gerekli alanları doldurun.');
      return;
    }

    try {
      const stockData = {
        warehouse: selectedWarehouse,
        product: selectedProduct,
        quantity: stockQuantity,
        minimum_stock: minStock,
        cost_price: costPrice ? parseFloat(costPrice) : null,
        sale_price: salePrice ? parseFloat(salePrice) : null,
        location_code: locationCode || null,
        barcode: barcode || null,
      };

      await api.post('/inventory/stock-items/', stockData);
      setShowAddStock(false);
      resetAddStockForm();
      fetchStockItems();
      alert('Stok başarıyla eklendi!');
    } catch (error: any) {
      console.error('Stok ekleme hatası:', error);
      const errorMsg = error.response?.data?.message || 'Stok ekleme sırasında bir hata oluştu.';
      alert(errorMsg);
    }
  };

  const resetAddStockForm = () => {
    setSelectedWarehouse(null);
    setSelectedCategory(null);
    setSelectedBrand('');
    setSelectedProduct(null);
    setStockQuantity(0);
    setMinStock(0);
    setCostPrice('');
    setSalePrice('');
    setLocationCode('');
    setBarcode('');
    setSelectedTireSize('');
    setSelectedBatteryCapacity('');
    setSelectedRimSize('');
    setSelectedBoltPattern('');
    setProducts([]);
    setTireSizes([]);
    setBatteryCapacities([]);
    setRimSpecs({ sizes: [], bolt_patterns: [] });
  };

  const showPriceHistoryModal = (stockItem: StockItem) => {
    setSelectedStockItem(stockItem);
    setShowPriceHistory(true);
  };

  const handleBulkSelection = (stockId: number, checked: boolean) => {
    if (checked) {
      setSelectedStockIds(prev => [...prev, stockId]);
    } else {
      setSelectedStockIds(prev => prev.filter(id => id !== stockId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStockIds(stockItems.map(item => item.id));
    } else {
      setSelectedStockIds([]);
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (selectedStockIds.length === 0 || !bulkValue) {
      alert('Lütfen güncellenecek stokları ve değeri seçin.');
      return;
    }

    try {
      const updateData = {
        stock_item_ids: selectedStockIds,
        change_type: bulkChangeType,
        value_type: bulkValueType,
        value: parseFloat(bulkValue),
        price_type: bulkPriceType,
        change_reason: bulkChangeReason || `Toplu ${bulkChangeType === 'increase' ? 'zam' : 'indirim'}`
      };

      await api.post('/inventory/stock-items/bulk-price-update/', updateData);
      
      setShowBulkPriceUpdate(false);
      setSelectedStockIds([]);
      setBulkValue('');
      setBulkChangeReason('');
      fetchStockItems();
      
      alert(`${selectedStockIds.length} adet ürünün fiyatı başarıyla güncellendi!`);
    } catch (error: any) {
      console.error('Toplu fiyat güncelleme hatası:', error);
      const errorMsg = error.response?.data?.message || 'Fiyat güncelleme sırasında bir hata oluştu.';
      alert(errorMsg);
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'low_stock':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'overstocked':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const renderCategoryOptions = (categories: Category[], level: number = 0) => {
    return categories.map(category => (
      <React.Fragment key={category.id}>
        <option value={category.id}>
          {'—'.repeat(level)} {category.name}
        </option>
        {category.children && renderCategoryOptions(category.children, level + 1)}
      </React.Fragment>
    ));
  };
  
  const clearFilters = () => {
    setSelectedWarehouseFilter(null);
    setSelectedCategoryFilter(null);
    setSelectedBrandFilter('');
    setSelectedTireSizeFilter('');
    setSelectedBatteryCapacityFilter('');
    setSelectedRimSizeFilter('');
    setSelectedBoltPatternFilter('');
    setSearchQuery('');
    setFilterBrands([]);
    setFilterTireSizes([]);
    setFilterBatteryCapacities([]);
    setFilterRimSpecs({ sizes: [], bolt_patterns: [] });
  };

  if (loading) {
    return (
      <Layout>
        <SubscriptionGuard requiredPermission="inventory_management">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </SubscriptionGuard>
      </Layout>
    );
  }

  const selectedCategoryObj = selectedCategory ? findCategoryById(selectedCategory) : null;

  return (
    <Layout>
      <SubscriptionGuard requiredPermission="inventory_management">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stok Yönetimi</h1>
              <p className="text-gray-600">Depo stoklarınızı yönetin ve takip edin</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtreler
              </button>
              {selectedStockIds.length > 0 && (
                <button
                  onClick={() => setShowBulkPriceUpdate(true)}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Toplu Fiyat Güncelle ({selectedStockIds.length})
                </button>
              )}
              <button
                onClick={() => setShowAddStock(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Stok Ekle
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filtreler</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Tüm Filtreleri Temizle
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Arama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arama
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ürün adı, SKU, marka veya barkod ile arama..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Temel Filtreler */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Temel Filtreler</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Depo
                      </label>
                      <select
                        value={selectedWarehouseFilter || ''}
                        onChange={(e) => setSelectedWarehouseFilter(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Tüm Depolar</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kategori
                      </label>
                      <select
                        value={selectedCategoryFilter || ''}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Tüm Kategoriler</option>
                        {renderCategoryOptions(categories)}
                      </select>
                    </div>
                    
                    {selectedCategoryFilter && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marka
                        </label>
                        <select
                          value={selectedBrandFilter}
                          onChange={(e) => setSelectedBrandFilter(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Tüm Markalar</option>
                          {filterBrands.map((brand) => (
                            <option key={brand} value={brand}>
                              {brand}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Özellik Filtreleri */}
                {selectedCategoryFilter && selectedBrandFilter && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Ürün Özellikleri</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(() => {
                        const selectedCategoryObj = findCategoryById(selectedCategoryFilter);
                        if (!selectedCategoryObj) return null;
                        
                        if (selectedCategoryObj.full_path.includes('Lastik')) {
                          return (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lastik Ebatı
                              </label>
                              <select
                                value={selectedTireSizeFilter}
                                onChange={(e) => setSelectedTireSizeFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Tüm Ebatlar</option>
                                {filterTireSizes.map((size) => (
                                  <option key={size.display} value={size.display}>
                                    {size.display}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }
                        
                        if (selectedCategoryObj.full_path.includes('Akü')) {
                          return (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Akü Kapasitesi
                              </label>
                              <select
                                value={selectedBatteryCapacityFilter}
                                onChange={(e) => setSelectedBatteryCapacityFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Tüm Kapasiteler</option>
                                {filterBatteryCapacities.map((capacity) => (
                                  <option key={capacity} value={capacity}>
                                    {capacity}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }
                        
                        if (selectedCategoryObj.full_path.includes('Jant')) {
                          return (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Jant Boyutu
                                </label>
                                <select
                                  value={selectedRimSizeFilter}
                                  onChange={(e) => setSelectedRimSizeFilter(e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Tüm Boyutlar</option>
                                  {filterRimSpecs.sizes.map((size) => (
                                    <option key={size} value={size}>
                                      {size}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Bijon Deseni
                                </label>
                                <select
                                  value={selectedBoltPatternFilter}
                                  onChange={(e) => setSelectedBoltPatternFilter(e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Tüm Desenler</option>
                                  {filterRimSpecs.bolt_patterns.map((pattern) => (
                                    <option key={pattern} value={pattern}>
                                      {pattern}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </>
                          );
                        }
                        
                        return null;
                      })()
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stock Items */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedStockIds.length === stockItems.length && stockItems.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
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
                      Fiyat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lokasyon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStockIds.includes(item.id)}
                          onChange={(e) => handleBulkSelection(item.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.product_details.name}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                {item.product_details.sku}
                              </span>
                              <span>{item.product_details.brand}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {item.product_details.category_path}
                            </p>
                            {item.product_details.get_tire_size && (
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                                {item.product_details.get_tire_size}
                              </span>
                            )}
                            {item.product_details.battery_ampere && (
                              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
                                {item.product_details.battery_ampere} {item.product_details.battery_voltage}
                              </span>
                            )}
                            {item.product_details.rim_size && (
                              <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mt-1">
                                {item.product_details.rim_size} {item.product_details.rim_bolt_pattern}
                              </span>
                            )}
                            {item.barcode && (
                              <p className="text-xs text-gray-500 mt-1">
                                Barkod: {item.barcode}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.warehouse_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.warehouse_code}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {item.quantity} adet
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStockStatusColor(item.stock_status)}`}>
                              {item.stock_status_display}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Kullanılabilir: {item.available_quantity}
                          </div>
                          <div className="text-xs text-gray-400">
                            Min: {item.minimum_stock}
                            {item.maximum_stock && ` | Max: ${item.maximum_stock}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {item.cost_price && (
                            <div className="text-sm text-gray-900">
                              Maliyet: ₺{parseFloat(item.cost_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                          {item.sale_price && (
                            <div className="text-sm text-gray-600">
                              Satış: ₺{parseFloat(item.sale_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Toplam: ₺{parseFloat(item.total_value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {item.location_code || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => showPriceHistoryModal(item)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Fiyat Geçmişi"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Stock Modal */}
          {showAddStock && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Yeni Stok Ekle</h2>
                    <button
                      onClick={() => {
                        setShowAddStock(false);
                        resetAddStockForm();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Step 1: Basic Info */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">1. Temel Bilgiler</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Depo <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedWarehouse || ''}
                            onChange={(e) => setSelectedWarehouse(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Depo Seçin</option>
                            {warehouses.map((warehouse) => (
                              <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name} ({warehouse.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kategori <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedCategory || ''}
                            onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Kategori Seçin</option>
                            {renderCategoryOptions(categories)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Brand Selection */}
                    {selectedCategory && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">2. Marka Seçimi</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Marka <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={selectedBrand}
                              onChange={(e) => setSelectedBrand(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Marka Seçin</option>
                              {brands.map((brand) => (
                                <option key={brand} value={brand}>
                                  {brand}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Product Specifications */}
                    {selectedCategory && selectedBrand && selectedCategoryObj && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">3. Ürün Özellikleri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Lastik özellikleri */}
                          {selectedCategoryObj.full_path.includes('Lastik') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ebat <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={selectedTireSize}
                                onChange={(e) => {
                                  setSelectedTireSize(e.target.value);
                                  fetchFilteredProducts();
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Ebat Seçin</option>
                                {tireSizes.map((size) => (
                                  <option key={size.display} value={size.display}>
                                    {size.display}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Akü özellikleri */}
                          {selectedCategoryObj.full_path.includes('Akü') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kapasite <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={selectedBatteryCapacity}
                                onChange={(e) => {
                                  setSelectedBatteryCapacity(e.target.value);
                                  fetchFilteredProducts();
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Kapasite Seçin</option>
                                {batteryCapacities.map((capacity) => (
                                  <option key={capacity} value={capacity}>
                                    {capacity}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Jant özellikleri */}
                          {selectedCategoryObj.full_path.includes('Jant') && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Boyut <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={selectedRimSize}
                                  onChange={(e) => {
                                    setSelectedRimSize(e.target.value);
                                    fetchFilteredProducts();
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Boyut Seçin</option>
                                  {rimSpecs.sizes.map((size) => (
                                    <option key={size} value={size}>
                                      {size}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Bijon Deseni <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={selectedBoltPattern}
                                  onChange={(e) => {
                                    setSelectedBoltPattern(e.target.value);
                                    fetchFilteredProducts();
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Bijon Deseni Seçin</option>
                                  {rimSpecs.bolt_patterns.map((pattern) => (
                                    <option key={pattern} value={pattern}>
                                      {pattern}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 4: Product Selection */}
                    {products.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">4. Ürün Seçimi</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ürün <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={selectedProduct || ''}
                              onChange={(e) => setSelectedProduct(e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Ürün Seçin</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} ({product.sku})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Stock Details */}
                    {selectedProduct && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">5. Stok Detayları</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Miktar <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={stockQuantity}
                              onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                              min="1"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Minimum Stok
                            </label>
                            <input
                              type="number"
                              value={minStock}
                              onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                              min="0"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Lokasyon Kodu
                            </label>
                            <input
                              type="text"
                              value={locationCode}
                              onChange={(e) => setLocationCode(e.target.value)}
                              placeholder="Örn: A1-B2"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Maliyet Fiyatı (₺)
                            </label>
                            <input
                              type="number"
                              value={costPrice}
                              onChange={(e) => setCostPrice(e.target.value)}
                              step="0.01"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Satış Fiyatı (₺)
                            </label>
                            <input
                              type="number"
                              value={salePrice}
                              onChange={(e) => setSalePrice(e.target.value)}
                              step="0.01"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Barkod
                            </label>
                            <input
                              type="text"
                              value={barcode}
                              onChange={(e) => setBarcode(e.target.value)}
                              placeholder="Barkod"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                    <button
                      onClick={() => {
                        setShowAddStock(false);
                        resetAddStockForm();
                      }}
                      className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleAddStock}
                      disabled={!selectedWarehouse || !selectedProduct || stockQuantity <= 0}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Stok Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Price History Modal */}
          {showPriceHistory && selectedStockItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Fiyat Geçmişi</h2>
                    <button
                      onClick={() => setShowPriceHistory(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedStockItem.product_details.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedStockItem.product_details.sku} | {selectedStockItem.warehouse_name}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Güncel Fiyatlar</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Maliyet Fiyatı:</span>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedStockItem.cost_price 
                              ? `₺${parseFloat(selectedStockItem.cost_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                              : '-'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Satış Fiyatı:</span>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedStockItem.sale_price 
                              ? `₺${parseFloat(selectedStockItem.sale_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                              : '-'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedStockItem.price_history && selectedStockItem.price_history.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Geçmiş Değişiklikler</h4>
                        {selectedStockItem.price_history.map((history, index) => (
                          <div key={index} className="border border-gray-200 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {history.change_type_display}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(history.created_at).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            {history.cost_price_change_display && (
                              <p className="text-sm text-gray-600 mb-1">
                                Maliyet: {history.cost_price_change_display}
                              </p>
                            )}
                            {history.sale_price_change_display && (
                              <p className="text-sm text-gray-600 mb-1">
                                Satış: {history.sale_price_change_display}
                              </p>
                            )}
                            {history.change_reason && (
                              <p className="text-xs text-gray-500">
                                Neden: {history.change_reason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Henüz fiyat değişikliği kaydı bulunmuyor.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Price Update Modal */}
          {showBulkPriceUpdate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Toplu Fiyat Güncelleme</h2>
                    <button
                      onClick={() => setShowBulkPriceUpdate(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      {selectedStockIds.length} adet stok kaleminin fiyatı güncellenecek.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* İşlem Türü */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        İşlem Türü
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="changeType"
                            value="increase"
                            checked={bulkChangeType === 'increase'}
                            onChange={(e) => setBulkChangeType(e.target.value as 'increase' | 'decrease')}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Zam</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="changeType"
                            value="decrease"
                            checked={bulkChangeType === 'decrease'}
                            onChange={(e) => setBulkChangeType(e.target.value as 'increase' | 'decrease')}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">İndirim</span>
                        </label>
                      </div>
                    </div>

                    {/* Değer Türü */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Değer Türü
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="valueType"
                            value="percentage"
                            checked={bulkValueType === 'percentage'}
                            onChange={(e) => setBulkValueType(e.target.value as 'percentage' | 'fixed')}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yüzde (%)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="valueType"
                            value="fixed"
                            checked={bulkValueType === 'fixed'}
                            onChange={(e) => setBulkValueType(e.target.value as 'percentage' | 'fixed')}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Sabit Tutar (₺)</span>
                        </label>
                      </div>
                    </div>

                    {/* Değer */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {bulkValueType === 'percentage' ? 'Yüzde Oranı' : 'Tutar'} 
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={bulkValue}
                          onChange={(e) => setBulkValue(e.target.value)}
                          step={bulkValueType === 'percentage' ? '0.1' : '0.01'}
                          min="0"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={bulkValueType === 'percentage' ? '10' : '5.00'}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">
                            {bulkValueType === 'percentage' ? '%' : '₺'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fiyat Türü */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hangi Fiyata Uygulanacak
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="priceType"
                            value="cost_price"
                            checked={bulkPriceType === 'cost_price'}
                            onChange={(e) => setBulkPriceType(e.target.value as 'cost_price' | 'sale_price' | 'both')}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Sadece Maliyet Fiyatı</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="priceType"
                            value="sale_price"
                            checked={bulkPriceType === 'sale_price'}
                            onChange={(e) => setBulkPriceType(e.target.value as 'cost_price' | 'sale_price' | 'both')}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Sadece Satış Fiyatı</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="priceType"
                            value="both"
                            checked={bulkPriceType === 'both'}
                            onChange={(e) => setBulkPriceType(e.target.value as 'cost_price' | 'sale_price' | 'both')}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Her İki Fiyat</span>
                        </label>
                      </div>
                    </div>

                    {/* Değişiklik Nedeni */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Değişiklik Nedeni
                      </label>
                      <textarea
                        value={bulkChangeReason}
                        onChange={(e) => setBulkChangeReason(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Örn: Piyasa koşulları nedeniyle güncelleme"
                      />
                    </div>

                    {/* Özet */}
                    {bulkValue && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Güncelleme Özeti</h4>
                        <p className="text-sm text-blue-800">
                          {selectedStockIds.length} adet ürünün{' '}
                          {bulkPriceType === 'cost_price' ? 'maliyet fiyatına' : 
                           bulkPriceType === 'sale_price' ? 'satış fiyatına' : 'her iki fiyatına'}{' '}
                          {bulkValueType === 'percentage' 
                            ? `%${bulkValue} oranında ${bulkChangeType === 'increase' ? 'zam' : 'indirim'}`
                            : `₺${bulkValue} ${bulkChangeType === 'increase' ? 'zam' : 'indirim'}`
                          } uygulanacak.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                    <button
                      onClick={() => {
                        setShowBulkPriceUpdate(false);
                        setBulkValue('');
                        setBulkChangeReason('');
                      }}
                      className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleBulkPriceUpdate}
                      disabled={!bulkValue || selectedStockIds.length === 0}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Fiyatları Güncelle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SubscriptionGuard>
    </Layout>
  );
}