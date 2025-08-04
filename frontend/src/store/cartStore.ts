// frontend/src/store/cartStore.ts - DÜZELTILMIŞ VERSİYON
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MarketProduct, CartCalculation, ordersApi, handleApiError } from '@/lib/api';

export interface CartProduct extends MarketProduct {
  quantity: number;
  addedAt: string;
}

interface CartState {
  // State
  items: CartProduct[];
  selectedWholesalerId: number | null;
  selectedWholesalerName: string | null;
  cartCalculation: CartCalculation | null;
  isCalculating: boolean;
  calculationError: string | null;
  
  // Actions
  addItem: (product: MarketProduct, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setWholesaler: (wholesalerId: number, wholesalerName: string) => void;
  calculateCart: () => Promise<void>;
  getCartItemsForWholesaler: (wholesalerId: number) => CartProduct[];
  getTotalItems: () => number;
  getTotalUniqueProducts: () => number;
  hasItems: () => boolean;
  canCheckout: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      selectedWholesalerId: null,
      selectedWholesalerName: null,
      cartCalculation: null,
      isCalculating: false,
      calculationError: null,

      // Add item to cart
       // Add item to cart
      addItem: (product: MarketProduct, quantity = 1) => {
        const { items, selectedWholesalerId, clearCart, updateQuantity, setWholesaler } = get();
        const productWholesalerId = product.wholesaler_info?.id;

        // Eğer sepette ürün varsa ve eklenen yeni ürün farklı bir toptancıya aitse, sepeti temizle.
        if (selectedWholesalerId && productWholesalerId && selectedWholesalerId !== productWholesalerId) {
          console.warn(`Farklı bir toptancıdan ürün eklendi. Mevcut sepet temizleniyor.`);
          clearCart(); // Sepeti temizle
        }

        // State'i en güncel haliyle tekrar al (clearCart sonrası)
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item.id === product.id);

        if (existingItem) {
          // Mevcut ürünün miktarını güncelle
          updateQuantity(product.id, existingItem.quantity + quantity);
        } else {
          // Yeni ürün ekle
          const newItem: CartProduct = {
            ...product,
            quantity,
            addedAt: new Date().toISOString(),
          };
          
          set({ items: [...currentItems, newItem] });
          
          // Eğer bu ilk ürünse (veya sepet temizlendiyse), toptancıyı otomatik olarak ayarla
          if (get().items.length === 1 && product.wholesaler_info) {
            setWholesaler(product.wholesaler_info.id, product.wholesaler_info.name);
          }
          
          console.log(`✅ ${product.name} sepete eklendi (${quantity} adet)`);
        }
        
        // Toptancı seçiliyse sepeti otomatik hesapla
        if (get().selectedWholesalerId) {
          setTimeout(() => get().calculateCart(), 100);
        }
      },

      // Remove item from cart
      removeItem: (productId: number) => {
        const currentItems = get().items;
        const updatedItems = currentItems.filter(item => item.id !== productId);
        
        set({ items: updatedItems });
        
        // If cart is empty, clear wholesaler selection
        if (updatedItems.length === 0) {
          set({ 
            selectedWholesalerId: null, 
            selectedWholesalerName: null,
            cartCalculation: null 
          });
        } else if (get().selectedWholesalerId) {
          // Recalculate if items remain
          setTimeout(() => get().calculateCart(), 100);
        }
        
        console.log(`❌ Removed product ${productId} from cart`);
      },

      // Update item quantity
      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        const currentItems = get().items;
        const updatedItems = currentItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        );
        
        set({ items: updatedItems });
        
        // Auto-calculate if wholesaler selected
        if (get().selectedWholesalerId) {
          setTimeout(() => get().calculateCart(), 100);
        }
        
        console.log(`🔄 Updated product ${productId} quantity to ${quantity}`);
      },

      // Clear entire cart
      clearCart: () => {
        set({ 
          items: [],
          selectedWholesalerId: null,
          selectedWholesalerName: null,
          cartCalculation: null,
          calculationError: null
        });
        
        console.log('🗑️ Cart cleared');
      },

      // Set selected wholesaler
      setWholesaler: (wholesalerId: number, wholesalerName: string) => {
        set({ 
          selectedWholesalerId: wholesalerId,
          selectedWholesalerName: wholesalerName,
          calculationError: null
        });
        
        // Auto-calculate cart
        setTimeout(() => get().calculateCart(), 100);
        
        console.log(`🏪 Selected wholesaler: ${wholesalerName} (${wholesalerId})`);
      },

      // Calculate cart totals via API
      calculateCart: async () => {
        const { items, selectedWholesalerId } = get();
        
        
        if (items.length === 0) {
          set({ cartCalculation: null, calculationError: null });
          return;
        }
        
        // Eğer ürünlerin wholesaler_info'su yoksa, tüm ürünleri hesapla
        const hasWholesalerInfo = items.some(item => item.wholesaler_info?.id);
        
        let wholesalerItems = items;
        let effectiveWholesalerId = selectedWholesalerId;
        
        if (hasWholesalerInfo) {
          // Normal durum: toptancı bilgisi olan ürünler
          if (!selectedWholesalerId) {
            set({ cartCalculation: null, calculationError: null });
            return;
          }
          
          wholesalerItems = items.filter(item => 
            item.wholesaler_info?.id === selectedWholesalerId
          );
          
          if (wholesalerItems.length === 0) {
            set({ cartCalculation: null, calculationError: null });
            return;
          }
        } else {
          // Özel durum: ürünlerin wholesaler_info'su yok, direkt hesapla
          effectiveWholesalerId = 1; // Default wholesaler ID kullan
        }
        
        try {
          set({ isCalculating: true, calculationError: null });
          
          const cartData = {
            wholesaler_id: effectiveWholesalerId,
            items: wholesalerItems.map(item => ({
              product_id: item.id,
              quantity: item.quantity
            }))
          };
          
          const response = await ordersApi.calculateCart(cartData);
          
          set({ 
            cartCalculation: response.cart,
            isCalculating: false,
            calculationError: null
          });
          
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          
          set({ 
            cartCalculation: null,
            isCalculating: false,
            calculationError: errorMessage
          });
        }
      },

      // Get items for specific wholesaler
      getCartItemsForWholesaler: (wholesalerId: number) => {
        return get().items.filter(item => 
          item.wholesaler_info?.id === wholesalerId
        );
      },

      // Get total number of items (with quantities)
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Get total unique products
      getTotalUniqueProducts: () => {
        return get().items.length;
      },

      // Check if cart has items
      hasItems: () => {
        return get().items.length > 0;
      },

      // DÜZELTILMIŞ: Check if can checkout
      // Check if can checkout
      canCheckout: () => {
        const { items, selectedWholesalerId, cartCalculation } = get();
        
        // Ürünlerin wholesaler_info'su var mı kontrol et
        const hasWholesalerInfo = items.some(item => item.wholesaler_info?.id);
        
        const hasItems = items.length > 0;
        const hasValidWholesaler = hasWholesalerInfo ? selectedWholesalerId !== null : true;
        const hasValidCalculation = cartCalculation !== null &&
                                   cartCalculation.total_amount !== '0.00' &&
                                   parseFloat(cartCalculation.total_amount) > 0;
        
        const result = hasItems && hasValidWholesaler && hasValidCalculation;
        
        
        return result;
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Don't persist calculation states
      partialize: (state) => ({
        items: state.items,
        selectedWholesalerId: state.selectedWholesalerId,
        selectedWholesalerName: state.selectedWholesalerName,
      }),
    }
  )
);

// DÜZELTILMIŞ Helper hooks
export const useCart = () => {
  const state = useCartStore();
  const {
    items,
    selectedWholesalerId,
    selectedWholesalerName,
    cartCalculation,
    isCalculating,
    calculationError,
  } = state;

  return {
    items,
    selectedWholesalerId,
    selectedWholesalerName,
    cartCalculation,
    isCalculating,
    calculationError,
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
    totalUniqueProducts: items.length,
    hasItems: items.length > 0,
    canCheckout: state.canCheckout(), // Store state'ini kullanarak fonksiyon çağır
  };
};

export const useCartActions = () => {
  const {
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setWholesaler,
    calculateCart,
    getCartItemsForWholesaler,
  } = useCartStore();

  return {
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setWholesaler,
    calculateCart,
    getCartItemsForWholesaler,
  };
};