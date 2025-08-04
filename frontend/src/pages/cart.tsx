// frontend/src/pages/cart.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight,
  ArrowLeft,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import { useCart, useCartActions } from '@/store/cartStore';
import { ordersApi, handleApiError, CreateOrderRequest } from '@/lib/api';

const CartPage: React.FC = () => {
  const router = useRouter();
  
  // Cart state
  const {
    items,
    selectedWholesalerId,
    selectedWholesalerName,
    cartCalculation,
    isCalculating,
    calculationError,
    totalItems,
    totalUniqueProducts,
    hasItems,
    canCheckout
  } = useCart();
  
  const {
    updateQuantity,
    removeItem,
    clearCart,
    calculateCart
  } = useCartActions();

  // Component state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    contact: '',
    phone: '',
    notes: ''
  });

  // Calculate cart on mount
  useEffect(() => {
    if (hasItems) {
      // Ürünlerin wholesaler_info'su var mı kontrol et
      const hasWholesalerInfo = items.some(item => item.wholesaler_info?.id);
      
      // Eğer wholesaler_info varsa ve wholesaler seçilmişse hesapla
      // Eğer wholesaler_info yoksa direkt hesapla
      if (!hasWholesalerInfo || selectedWholesalerId) {
        calculateCart();
      }
    }
  }, [hasItems, selectedWholesalerId, items]);

  const formatPrice = (price: string) => {
    return `₺${parseFloat(price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: number) => {
    removeItem(productId);
  };

  const handlePlaceOrder = async () => {
    if (!canCheckout || !cartCalculation) {
      setOrderError('Sipariş verilemez. Sepet hesaplaması tamamlanmadı.');
      return;
    }

    if (!deliveryInfo.address.trim()) {
      setOrderError('Teslimat adresi zorunludur.');
      return;
    }

    try {
      setIsPlacingOrder(true);
      setOrderError(null);

      // Eğer selectedWholesalerId yoksa 1 kullan (mixed wholesaler durumu için)
      const effectiveWholesalerId = selectedWholesalerId || 1;
      
      const orderData: CreateOrderRequest = {
        wholesaler_id: effectiveWholesalerId,
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        delivery_address: deliveryInfo.address.trim(),
        delivery_contact: deliveryInfo.contact.trim(),
        delivery_phone: deliveryInfo.phone.trim(),
        notes: deliveryInfo.notes.trim()
      };

      const response = await ordersApi.createOrder(orderData);
      
      // Clear cart after successful order
      clearCart();
      
      // Redirect to orders page with success message
      router.push(`/dashboard/orders?success=1&orderNumber=${response.order.order_number}`);
      
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setOrderError(errorMessage);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Empty cart state
  if (!hasItems) {
    return (
      <AuthGuard>
        <Head>
          <title>Sepetim - Tyrex B2B</title>
          <meta name="description" content="Alışveriş sepetiniz" />
        </Head>

        <Layout title="Sepetim">
          <div className="text-center py-20">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Sepetiniz boş
            </h3>
            <p className="text-gray-600 mb-6">
              Pazaryerinden ürün ekleyerek alışverişe başlayın.
            </p>
            <Link href="/dashboard/products" className="btn btn-primary">
              <Package className="h-5 w-5 mr-2" />
              Pazaryerine Git
            </Link>
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Head>
        <title>Sepetim ({totalItems}) - Tyrex B2B</title>
        <meta name="description" content="Alışveriş sepetiniz" />
      </Head>

      <Layout title={`Sepetim (${totalItems} ürün)`}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li>
                <Link href="/dashboard/products" className="text-gray-500 hover:text-gray-700">
                  Pazaryeri
                </Link>
              </li>
              <li>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </li>
              <li className="text-gray-900 font-medium">Sepetim</li>
            </ol>
          </nav>

          {/* Error Messages */}
          {calculationError && (
            <div className="alert alert-error">
              <AlertCircle className="h-5 w-5 mr-2" />
              {calculationError}
            </div>
          )}

          {orderError && (
            <div className="alert alert-error">
              <AlertCircle className="h-5 w-5 mr-2" />
              {orderError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Wholesaler Info */}
              {selectedWholesalerName && (
                <div className="card">
                  <div className="card-body">
                    <h3 className="font-medium text-gray-900 mb-2">Toptancı</h3>
                    <p className="text-sm text-gray-600">{selectedWholesalerName}</p>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="card">
                <div className="card-header">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Sepet İçeriği ({totalUniqueProducts} ürün)
                    </h3>
                    <button
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-1 inline" />
                      Sepeti Temizle
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <div key={item.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {item.name}
                            </h4>
                            {item.brand && (
                              <p className="text-xs text-gray-500 mb-1">{item.brand}</p>
                            )}
                            <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                            
                            {/* Price info */}
                            <div className="mt-2">
                              {item.base_price && item.final_price && item.discount_percentage > 0 && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500 line-through">
                                    {formatPrice(item.base_price)}
                                  </span>
                                  <span className="text-xs text-green-600 font-medium">
                                    %{item.discount_percentage.toFixed(1)} indirim
                                  </span>
                                </div>
                              )}
                              <div className="text-sm font-medium text-gray-900">
                                {formatPrice(item.final_price || '0')}
                              </div>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="p-1 hover:bg-gray-100 rounded-l-md"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-3 py-1 text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="p-1 hover:bg-gray-100 rounded-r-md"
                                disabled={item.quantity >= item.available_stock}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Stock warning */}
                        {item.quantity >= item.available_stock && (
                          <div className="mt-2 text-xs text-amber-600">
                            ⚠️ Maksimum stok: {item.available_stock} adet
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-6">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Sipariş Özeti</h3>
                </div>
                <div className="card-body space-y-4">
                  {/* Loading state */}
                  {isCalculating && (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Hesaplanıyor...</p>
                    </div>
                  )}

                  {/* Cart calculation */}
                  {cartCalculation && !isCalculating && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Ara Toplam:</span>
                        <span>{formatPrice(cartCalculation.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Para Birimi:</span>
                        <span>{cartCalculation.currency}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-medium">
                          <span>Toplam:</span>
                          <span>{formatPrice(cartCalculation.total_amount)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {cartCalculation.total_items} adet • {cartCalculation.unique_products} farklı ürün
                      </div>
                    </div>
                  )}

                  {/* No calculation state */}
                  {!cartCalculation && !isCalculating && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">Sepet hesaplanması tamamlanmadı</p>
                    </div>
                  )}

                  {/* Delivery Info */}
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-medium text-gray-900">Teslimat Bilgileri</h4>
                    
                    <div>
                      <label className="form-label">Teslimat Adresi</label>
                      <textarea
                        rows={3}
                        className="form-input"
                        placeholder="Teslimat adresinizi girin..."
                        value={deliveryInfo.address}
                        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="form-label">İletişim Kişisi</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ad Soyad"
                        value={deliveryInfo.contact}
                        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, contact: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="form-label">Telefon</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="+90 5XX XXX XX XX"
                        value={deliveryInfo.phone}
                        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="form-label">Sipariş Notu (Opsiyonel)</label>
                      <textarea
                        rows={2}
                        className="form-input"
                        placeholder="Özel talimatlarınız..."
                        value={deliveryInfo.notes}
                        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <div className="space-y-3 pt-4 border-t">

                    <button
                      onClick={handlePlaceOrder}
                      disabled={!canCheckout || isPlacingOrder || !deliveryInfo.address.trim()}
                      className={`btn w-full ${
                        (!canCheckout || isPlacingOrder || !deliveryInfo.address.trim())
                          ? 'btn-secondary cursor-not-allowed opacity-50'
                          : 'btn-primary hover:bg-primary-700'
                      }`}
                    >
                      {isPlacingOrder ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sipariş Veriliyor...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Siparişi Tamamla
                        </>
                      )}
                    </button>

                    {/* Validation Messages */}
                    {!canCheckout && (
                      <p className="text-xs text-red-600">
                        ⚠️ Sepet hesaplanması tamamlanmadı
                      </p>
                    )}
                    
                    {!deliveryInfo.address.trim() && (
                      <p className="text-xs text-red-600">
                        ⚠️ Teslimat adresi gerekli
                      </p>
                    )}

                    <Link href="/dashboard/products" className="btn btn-outline w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Alışverişe Devam Et
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default CartPage;