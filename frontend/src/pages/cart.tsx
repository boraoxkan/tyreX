// frontend/src/pages/cart.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  CreditCard,
  Truck,
  User,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import { useCart, useCartActions } from '@/store/cartStore';
import { ordersApi, handleApiError } from '@/lib/api';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    contact: '',
    phone: '',
    notes: ''
  });

  // Calculate cart on mount and when items change
  useEffect(() => {
    if (hasItems && selectedWholesalerId) {
        calculateCart();
    }
  }, [hasItems, selectedWholesalerId]);

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId: number) => {
    removeItem(productId);
  };

  const handleDeliveryChange = (field: keyof typeof deliveryInfo, value: string) => {
    setDeliveryInfo(prev => ({ ...prev, [field]: value }));
  };

  // 2. handleCheckout fonksiyonunu debug edin (yaklaşık 55. satır civarında):
  const handleCheckout = async () => {
    console.log('🛒 Checkout clicked!', {
        canCheckout,
        selectedWholesalerId,
        items: items.length,
        cartCalculation: !!cartCalculation
    });

    if (!canCheckout || !selectedWholesalerId) {
        console.error('❌ Cannot checkout:', { canCheckout, selectedWholesalerId });
        setOrderError('Sipariş verilemez. Lütfen sepetinizi kontrol edin.');
        return;
    }

    try {
        setIsSubmitting(true);
        setOrderError(null);
        
        console.log('📤 Creating order...');

        // Prepare order data
        const orderData = {
        wholesaler_id: selectedWholesalerId,
        items: items.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        })),
        delivery_address: deliveryInfo.address,
        delivery_contact: deliveryInfo.contact,
        delivery_phone: deliveryInfo.phone,
        notes: deliveryInfo.notes
        };

        console.log('📋 Order data:', orderData);

        const response = await ordersApi.createOrder(orderData);
        
        console.log('✅ Order created successfully:', response);

        // Clear cart on success
        clearCart();

        // Redirect to orders page with success message
        router.push({
        pathname: '/dashboard/orders',
        query: { 
            success: 'true', 
            orderNumber: response.order.order_number 
        }
        });

    } catch (error: any) {
        const errorMessage = handleApiError(error);
        setOrderError(errorMessage);
        console.error('❌ Order creation failed:', error);
        console.error('❌ Error message:', errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  const formatPrice = (price: string | undefined) => {
    if (!price) return '₺0,00';
    return `₺${parseFloat(price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  // Empty cart state
  if (!hasItems) {
    return (
      <AuthGuard>
        <Head>
          <title>Sepetim - Tyrex B2B</title>
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
        <title>Sepetim ({items.length} ürün) - Tyrex B2B</title>
      </Head>
      
      <Layout title="Sepetim">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Back to Products */}
          <div className="flex items-center">
            <Link 
              href="/dashboard/products" 
              className="inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Alışverişe Devam Et
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-medium text-gray-900">
                    Sepetinizdeki Ürünler ({items.length})
                  </h2>
                  {selectedWholesalerName && (
                    <p className="text-sm text-gray-600 mt-1">
                      Toptancı: {selectedWholesalerName}
                    </p>
                  )}
                </div>
                
                <div className="card-body p-0">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border-b border-gray-200 last:border-b-0">
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </h3>
                          <div className="mt-1 space-y-1">
                            {item.brand && (
                              <p className="text-xs text-gray-500">Marka: {item.brand}</p>
                            )}
                            <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                            {item.wholesaler_info && (
                              <p className="text-xs text-gray-600">
                                {item.wholesaler_info.name}
                              </p>
                            )}
                          </div>
                          
                          {/* Price Info */}
                          <div className="mt-2">
                            {item.final_price && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {formatPrice(item.final_price)}
                                </span>
                                {item.discount_percentage > 0 && (
                                  <>
                                    <span className="text-xs text-gray-500 line-through">
                                      {formatPrice(item.base_price)}
                                    </span>
                                    <span className="text-xs font-medium text-green-600">
                                      %{item.discount_percentage.toFixed(1)} indirim
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          
                          <span className="w-12 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                            disabled={item.quantity >= item.available_stock}
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(
                              item.final_price 
                                ? (parseFloat(item.final_price) * item.quantity).toFixed(2)
                                : '0'
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.quantity} × {formatPrice(item.final_price)}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                          title="Sepetten Çıkar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">
                    Teslimat Bilgileri
                  </h3>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label className="form-label">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Teslimat Adresi
                    </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Teslimat adresini girin..."
                      value={deliveryInfo.address}
                      onChange={(e) => handleDeliveryChange('address', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">
                        <User className="h-4 w-4 inline mr-1" />
                        İletişim Kişisi
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ad Soyad"
                        value={deliveryInfo.contact}
                        onChange={(e) => handleDeliveryChange('contact', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Telefon
                      </label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="0555 123 45 67"
                        value={deliveryInfo.phone}
                        onChange={(e) => handleDeliveryChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Sipariş Notları (Opsiyonel)</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Özel notlarınız..."
                      value={deliveryInfo.notes}
                      onChange={(e) => handleDeliveryChange('notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-6">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">
                    Sipariş Özeti
                  </h3>
                </div>
                
                <div className="card-body space-y-4">
                  {/* Calculation Loading */}
                  {isCalculating && (
                    <div className="text-center py-4">
                      <div className="spinner h-6 w-6 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Hesaplanıyor...</p>
                    </div>
                  )}

                  {/* Calculation Error */}
                  {calculationError && (
                    <div className="alert alert-error">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <div>
                        <p className="text-sm">{calculationError}</p>
                        <button 
                          onClick={calculateCart}
                          className="mt-2 btn btn-sm btn-outline"
                        >
                          Tekrar Hesapla
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cart Calculation */}
                  {cartCalculation && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Ara Toplam:</span>
                          <span>{formatPrice(cartCalculation.subtotal)}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Toplam İndirim:</span>
                          <span>
                            -{formatPrice(
                              cartCalculation.items.reduce((total, item) => {
                                const savings = parseFloat(item.wholesaler_reference_price) - parseFloat(item.unit_price);
                                return total + (savings * item.quantity);
                              }, 0).toFixed(2)
                            )}
                          </span>
                        </div>
                        
                        <hr className="border-gray-200" />
                        
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Toplam:</span>
                          <span>{formatPrice(cartCalculation.total_amount)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <p>• {cartCalculation.total_items} adet ürün</p>
                        <p>• {cartCalculation.unique_products} farklı ürün</p>
                        <p>• Para birimi: {cartCalculation.currency}</p>
                      </div>
                    </>
                  )}

                  {/* Order Error */}
                  {orderError && (
                    <div className="alert alert-error">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {orderError}
                    </div>
                  )}

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={!canCheckout || isSubmitting || isCalculating}
                    className={`btn w-full ${
                        !canCheckout || isSubmitting || isCalculating 
                        ? 'btn-secondary cursor-not-allowed opacity-50' 
                        : 'btn-primary hover:bg-primary-700'
                    }`}
                    type="button" // Explicit type
                    >
                    {isSubmitting ? (
                        <>
                        <div className="spinner h-4 w-4 mr-2"></div>
                        Sipariş Veriliyor...
                        </>
                    ) : (
                        <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Siparişi Ver
                        </>
                    )}
                  </button>


                  <div className="text-xs text-gray-500 text-center space-y-1">
                    <p>• Siparişiniz vereceğiniz anda toptancıya iletilecektir</p>
                    <p>• Toptancı onayladıktan sonra hazırlanmaya başlayacaktır</p>
                    <p>• Sipariş durumunu "Siparişlerim" sayfasından takip edebilirsiniz</p>
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