// frontend/src/lib/api.ts - Complete fixed version
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';

// API Response Types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user?: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  company_name: string;
  company_phone?: string;
  company_address?: string;
  wholesaler_relations?: WholesalerRelation[];
  credit_limit?: number;
  payment_terms_days?: number;
  notes?: string;
}

export interface RegisterResponse {
  user: User;
  company: Company;
  subscription: {
    created: boolean;
    plan: string | null;
    status: string;
    trial_end_date?: string;
    marketplace_access: boolean;
    dynamic_pricing: boolean;
  };
  wholesaler_relations_created: number;
  message: string;
  trial_info?: {
    trial_days: number;
    trial_features: string[];
  };
}

// User Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  is_active: boolean;
  company_id: number | null;
  company_name: string | null;
  company_type: string | null;
}

export interface Company {
  id: number;
  name: string;
  company_type: string;
  is_managed_by_tyrex: boolean;
  email?: string;
  phone?: string;
  address?: string;
}

export interface WholesalerRelation {
  wholesaler_id: number;
  credit_limit?: number;
  payment_terms_days?: number;
  notes?: string;
}

export interface Wholesaler {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Inventory Types
export interface Warehouse {
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

export interface StockItem {
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

// Market Types (add to existing types)
export interface MarketProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  model?: string;
  short_description?: string;
  category_name?: string;
  category_path?: string;
  weight?: string;
  total_stock: number;
  available_stock: number;
  base_price?: string;
  final_price?: string;
  discount_percentage: number;
  wholesaler_info?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  is_known_wholesaler: boolean;
  attributes: Array<{
    name: string;
    value: string;
    unit?: string;
  }>;
  is_active: boolean;
  created_at: string;
}

export interface MarketFilter {
  category?: number;
  brand?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  known_wholesalers_only?: boolean;
  search?: string;
  ordering?: string;
}

export interface MarketplaceStats {
  total_products: number;
  total_wholesalers: number;
  known_wholesalers: number;
  products_in_stock: number;
  average_discount: string;
  categories_count: number;
  your_potential_savings: string;
}

// Order Types (add to existing types)
export interface OrderItem {
  id?: number;
  product: number;
  product_details?: {
    id: number;
    name: string;
    sku: string;
    brand?: string;
    category_name?: string;
  };
  warehouse?: number;
  warehouse_name?: string;
  wholesaler_name?: string;
  quantity: number;
  unit_price?: string;
  wholesaler_reference_price?: string;
  total_price?: string;
  discount_percentage?: string;
  discount_amount?: string;
  calculated_discount_percentage?: string;
  product_name?: string;
  product_sku?: string;
  product_brand?: string;
  is_canceled?: boolean;
  canceled_at?: string;
  cancel_reason?: string;
}

export interface Order {
  id: number;
  order_number: string;
  uuid: string;
  retailer: number;
  retailer_name: string;
  wholesaler: number;
  wholesaler_name: string;
  retailer_user: number;
  retailer_user_name: string;
  status: string;
  status_display: string;
  payment_status: string;
  payment_status_display: string;
  subtotal: string;
  tax_amount: string;
  shipping_cost: string;
  discount_amount: string;
  total_amount: string;
  currency: string;
  tyrex_commission_rate: string;
  tyrex_commission_amount: string;
  delivery_address?: string;
  delivery_contact?: string;
  delivery_phone?: string;
  payment_terms_days: number;
  due_date?: string;
  notes?: string;
  order_date: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  canceled_at?: string;
  items: OrderItem[];
  total_items: number;
  total_unique_products: number;
  can_be_canceled: boolean;
  can_be_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: number;
  quantity: number;
}

export interface CartCalculation {
  wholesaler: {
    id: number;
    name: string;
  };
  items: Array<{
    product: {
      id: number;
      name: string;
      sku: string;
      brand?: string;
    };
    quantity: number;
    available_stock: number;
    unit_price: string;
    wholesaler_reference_price: string;
    discount_percentage: string;
    item_total: string;
    warehouse: {
      id: number;
      name: string;
    };
  }>;
  subtotal: string;
  total_amount: string;
  currency: string;
  total_items: number;
  unique_products: number;
}

export interface CreateOrderRequest {
  wholesaler_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    stock_item_id?: number;
  }>;
  delivery_address?: string;
  delivery_contact?: string;
  delivery_phone?: string;
  notes?: string;
}

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Cookie'den token oku (localStorage yerine)
    const getTokenFromCookie = () => {
      const cookies = document.cookie.split(';');
      const accessTokenCookie = cookies.find(c => c.trim().startsWith('access_token='));
      return accessTokenCookie ? accessTokenCookie.split('=')[1] : null;
    };

    const token = getTokenFromCookie();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
        headers: config.headers.Authorization ? 'Bearer ***' : 'No auth'
      });
    }
    
    return config;
  },
  (error) => {
    console.error('🚨 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor da güncelleyin (refresh token logic):
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    
    // Handle 401 - Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Cookie'den refresh token oku
      const getRefreshTokenFromCookie = () => {
        const cookies = document.cookie.split(';');
        const refreshTokenCookie = cookies.find(c => c.trim().startsWith('refresh_token='));
        return refreshTokenCookie ? refreshTokenCookie.split('=')[1] : null;
      };

      const refreshToken = getRefreshTokenFromCookie();
      
      if (refreshToken) {
        try {
          console.log('🔄 Token expired, refreshing...');
          
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/token/refresh/`,
            { refresh: refreshToken }
          );
          
          const newAccessToken = response.data.access;
          
          // Cookie'ye yeni token'ı kaydet
          document.cookie = `access_token=${newAccessToken}; path=/; max-age=86400; SameSite=Lax`;
          
          console.log('✅ Token refreshed successfully');
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
          
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          
          // Clear tokens and redirect to login
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          localStorage.removeItem('auth-storage');
          
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        console.log('❌ No refresh token, redirecting to login');
        // No refresh token, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// API Methods
export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/token/', credentials);
      
      // Handle different response formats from Django
      const data = response.data;
      
      // Ensure we have the required tokens
      if (!data.access || !data.refresh) {
        throw new Error('Invalid response: missing authentication tokens');
      }
      
      return data;
    } catch (error: any) {
      console.error('Login API error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Register
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const response = await api.post<RegisterResponse>('/auth/register/', data);
      return response.data;
    } catch (error: any) {
      console.error('Register API error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Refresh token
  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const response = await api.post<{ access: string }>('/auth/token/refresh/', { refresh });
    return response.data;
  },
  
  // Verify token
  verifyToken: async (token: string): Promise<void> => {
    await api.post('/auth/token/verify/', { token });
  },
};

export const userApi = {
  // Get current user profile
  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/users/me/');
      
      // Ensure we have valid user data
      if (!response.data || !response.data.email) {
        throw new Error('Invalid user profile data received');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Get profile API error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<{ message: string; user: User }> => {
    const response = await api.patch<{ message: string; user: User }>('/users/me/', data);
    return response.data;
  },
  
  // Get company info
  getCompanyInfo: async (): Promise<{
    company: Company | null;
    wholesaler_relationships: any[];
  }> => {
    const response = await api.get('/users/company-info/');
    return response.data;
  },
  
  // Get wholesaler summary
  getWholesalerSummary: async (): Promise<any> => {
    const response = await api.get('/users/wholesaler-summary/');
    return response.data;
  },
};

export const companyApi = {
  // Get wholesalers list
  getWholesalers: async (): Promise<Wholesaler[]> => {
    const response = await api.get<Wholesaler[]>('/companies/wholesalers/');
    return response.data;
  },
};

export const inventoryApi = {
  // Warehouse endpoints
  getWarehouses: async (): Promise<Warehouse[]> => {
    const response = await api.get<Warehouse[]>('/inventory/warehouses/');
    return response.data;
  },

  createWarehouse: async (data: any): Promise<{ message: string; warehouse: Warehouse }> => {
    const response = await api.post<{ message: string; warehouse: Warehouse }>('/inventory/warehouses/', data);
    return response.data;
  },

  updateWarehouse: async (id: number, data: any): Promise<{ message: string; warehouse: Warehouse }> => {
    const response = await api.put<{ message: string; warehouse: Warehouse }>(`/inventory/warehouses/${id}/`, data);
    return response.data;
  },

  deleteWarehouse: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/inventory/warehouses/${id}/`);
    return response.data;
  },

  getWarehouseStockSummary: async (id: number): Promise<any> => {
    const response = await api.get(`/inventory/warehouses/${id}/stock_summary/`);
    return response.data;
  },

  // Stock Item endpoints
  getStockItems: async (params?: URLSearchParams): Promise<StockItem[]> => {
    const url = params ? `/inventory/stock-items/?${params.toString()}` : '/inventory/stock-items/';
    const response = await api.get<StockItem[]>(url);
    return response.data;
  },

  createStockItem: async (data: any): Promise<{ message: string; stock_item: StockItem }> => {
    const response = await api.post<{ message: string; stock_item: StockItem }>('/inventory/stock-items/', data);
    return response.data;
  },

  updateStockItem: async (id: number, data: any): Promise<{ message: string; stock_item: StockItem }> => {
    const response = await api.put<{ message: string; stock_item: StockItem }>(`/inventory/stock-items/${id}/`, data);
    return response.data;
  },

  deleteStockItem: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/inventory/stock-items/${id}/`);
    return response.data;
  },

  getLowStockItems: async (): Promise<{ count: number; results: StockItem[] }> => {
    const response = await api.get<{ count: number; results: StockItem[] }>('/inventory/stock-items/low_stock/');
    return response.data;
  },

  getOutOfStockItems: async (): Promise<{ count: number; results: StockItem[] }> => {
    const response = await api.get<{ count: number; results: StockItem[] }>('/inventory/stock-items/out_of_stock/');
    return response.data;
  },

  stockMovement: async (id: number, data: any): Promise<any> => {
    const response = await api.post(`/inventory/stock-items/${id}/stock_movement/`, data);
    return response.data;
  },

  // Inventory summary
  getInventorySummary: async (): Promise<any> => {
    const response = await api.get('/inventory/summary/');
    return response.data;
  },
};

// Market API Functions
// Market API Functions (add to existing API object)
export const marketApi = {
  // Get marketplace products
  getProducts: async (filters?: MarketFilter): Promise<PaginatedResponse<MarketProduct>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const url = params.toString() ? `/market/products/?${params.toString()}` : '/market/products/';
    const response = await api.get<PaginatedResponse<MarketProduct>>(url);
    return response.data;
  },

  // Get single product detail
  getProductDetail: async (productId: number): Promise<MarketProduct> => {
    const response = await api.get<MarketProduct>(`/market/products/${productId}/`);
    return response.data;
  },

  // Get marketplace stats
  getStats: async (): Promise<MarketplaceStats> => {
    const response = await api.get<MarketplaceStats>('/market/stats/');
    return response.data;
  },

  // Clear marketplace cache (admin only)
  clearCache: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/market/clear-cache/');
    return response.data;
  },
};

// Order API Functions (add to existing API object)
export const ordersApi = {
  // Get orders list
  getOrders: async (params?: URLSearchParams): Promise<PaginatedResponse<Order>> => {
    const url = params ? `/orders/orders/?${params.toString()}` : '/orders/orders/';
    const response = await api.get<PaginatedResponse<Order>>(url);
    return response.data;
  },

  // Get single order
  getOrder: async (id: number): Promise<Order> => {
    const response = await api.get<Order>(`/orders/orders/${id}/`);
    return response.data;
  },

  // Create new order
  createOrder: async (data: CreateOrderRequest): Promise<{ 
    message: string; 
    order: Order 
  }> => {
    const response = await api.post<{ message: string; order: Order }>('/orders/orders/', data);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (id: number, data: {
    status: string;
    notes?: string;
  }): Promise<{ message: string; order: Order }> => {
    const response = await api.post<{ message: string; order: Order }>(`/orders/orders/${id}/update_status/`, data);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/orders/orders/${id}/`);
    return response.data;
  },

  // Get order status history
  getOrderHistory: async (id: number): Promise<{
    order_number: string;
    current_status: string;
    history: Array<{
      id: number;
      old_status?: string;
      old_status_display?: string;
      new_status: string;
      new_status_display: string;
      changed_by: {
        id?: number;
        name: string;
        email?: string;
      };
      change_reason?: string;
      notes?: string;
      changed_at: string;
    }>;
  }> => {
    const response = await api.get(`/orders/orders/${id}/status_history/`);
    return response.data;
  },

  // Get orders summary
  getOrdersSummary: async (): Promise<{
    total_orders: number;
    total_amount: string;
    currency: string;
    status_distribution: Record<string, {
      name: string;
      count: number;
      percentage: number;
    }>;
    recent_30_days: {
      count: number;
      amount: string;
      average_order_value: string;
    };
  }> => {
    const response = await api.get('/orders/orders/summary/');
    return response.data;
  },

  // Calculate cart (before placing order)
  calculateCart: async (data: {
    wholesaler_id: number;
    items: CartItem[];
  }): Promise<{ message: string; cart: CartCalculation }> => {
    const response = await api.post<{ message: string; cart: CartCalculation }>('/orders/calculate-cart/', data);
    return response.data;
  },

  // Get order statistics
  getStatistics: async (): Promise<any> => {
    const response = await api.get('/orders/statistics/');
    return response.data;
  },
};

export const healthApi = {
  // Health check
  check: async (): Promise<{
    status: string;
    message: string;
    version: string;
    endpoints: any;
  }> => {
    const response = await api.get('/health/');
    return response.data;
  },
};

// Helper functions
export const setAuthTokens = (accessToken: string, refreshToken: string): void => {
  Cookies.set('access_token', accessToken, { 
    expires: 1, // 1 day
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  Cookies.set('refresh_token', refreshToken, { 
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
};

export const clearAuthTokens = (): void => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
};

export const getAccessToken = (): string | undefined => {
  return Cookies.get('access_token');
};

export const getRefreshToken = (): string | undefined => {
  return Cookies.get('refresh_token');
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// Error handling helper
export const handleApiError = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as any;
    
    // Handle validation errors
    if (data.details && typeof data.details === 'object') {
      const firstError = Object.values(data.details)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }
    }
    
    // Handle single error message
    if (data.error) {
      return data.error;
    }
    
    if (data.message) {
      return data.message;
    }
    
    // Handle non_field_errors
    if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
      return data.non_field_errors[0];
    }
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.';
  }
  
  // Handle timeout
  if (error.code === 'ECONNABORTED') {
    return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
  }
  
  // Default error message
  return error.message || 'Bilinmeyen bir hata oluştu.';
};

export default api;