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

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
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

// Response interceptor - Handle token refresh and errors
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
      
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/token/refresh/`,
            { refresh: refreshToken }
          );
          
          const newAccessToken = response.data.access;
          Cookies.set('access_token', newAccessToken, { 
            expires: 1, // 1 day
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
          
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          
          // Clear tokens and redirect to login
          clearAuthTokens();
          
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          
          return Promise.reject(refreshError);
        }
      } else {
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