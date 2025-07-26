// frontend/src/store/cartStore.ts
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
      addItem: (product: MarketProduct, quantity = 1) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item.id === product.id);
        
        if (existingItem) {
          // Update existing item quantity
          get().updateQuantity(product.id, existingItem.quantity + quantity);
        } else {
          // Add new item
          const newItem: CartProduct = {
            ...product,
            quantity,
            addedAt: new Date().toISOString(),
          };
          
          set({ items: [...currentItems, newItem] });
          
          // If this is the first item, set wholesaler automatically
          if (currentItems.length === 0 && product.wholesaler_info) {
            get().setWholesaler(product.wholesaler_info.id, product.wholesaler_info.name);
          }
          
          console.log(`✅ Added ${product.name} to cart (${quantity} units)`);
        }
        
        // Auto-calculate cart if wholesaler is selected
        if (get().selectedWholesalerId) {
          get().calculateCart();
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
          get().calculateCart();
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
          get().calculateCart();
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
        get().calculateCart();
        
        console.log(`🏪 Selected wholesaler: ${wholesalerName} (${wholesalerId})`);
      },

      // Calculate cart totals via API
      calculateCart: async () => {
        const { items, selectedWholesalerId } = get();
        
        if (!selectedWholesalerId || items.length === 0) {
          set({ cartCalculation: null, calculationError: null });
          return;
        }
        
        // Filter items for selected wholesaler
        const wholesalerItems = items.filter(item => 
          item.wholesaler_info?.id === selectedWholesalerId
        );
        
        if (wholesalerItems.length === 0) {
          set({ cartCalculation: null, calculationError: null });
          return;
        }
        
        try {
          set({ isCalculating: true, calculationError: null });
          
          const cartData = {
            wholesaler_id: selectedWholesalerId,
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
          
          console.log('💰 Cart calculation updated:', response.cart);
          
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          
          set({ 
            cartCalculation: null,
            isCalculating: false,
            calculationError: errorMessage
          });
          
          console.error('❌ Cart calculation failed:', errorMessage);
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

      // Check if can checkout
      canCheckout: () => {
        const { items, selectedWholesalerId, cartCalculation } = get();
        return items.length > 0 && 
               selectedWholesalerId !== null && 
               cartCalculation !== null &&
               parseFloat(cartCalculation.total_amount) > 0;
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

// Helper hooks
export const useCart = () => {
  const {
    items,
    selectedWholesalerId,
    selectedWholesalerName,
    cartCalculation,
    isCalculating,
    calculationError,
  } = useCartStore();

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
    canCheckout: items.length > 0 && 
                 selectedWholesalerId !== null && 
                 cartCalculation !== null &&
                 cartCalculation.total_amount !== '0.00',
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