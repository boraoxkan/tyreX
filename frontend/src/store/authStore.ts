import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  authApi, 
  userApi, 
  User, 
  Company,
  Subscription,
  LoginRequest, 
  RegisterRequest, 
  setAuthTokens, 
  clearAuthTokens, 
  isAuthenticated,
  handleApiError 
} from '@/lib/api';

interface AuthState {
  // State
  user: User | null;
  company: Company | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      company: null,
      subscription: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Login action
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        console.log('authStore: Attempting login with credentials:', credentials.email);
        try {
          const response = await authApi.login(credentials);
          console.log('authStore: Login API successful, setting tokens.');
          setAuthTokens(response.access, response.refresh);
          await get().checkAuth(); // checkAuth will fetch user, company, and subscription
          console.log('authStore: checkAuth completed after login.');
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          console.error('authStore: Login failed:', errorMessage);
          clearAuthTokens();
          set({ user: null, company: null, subscription: null, isLoading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      // Register action
      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(data);
          await get().login({ email: data.email, password: data.password });
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          set({ user: null, company: null, subscription: null, isLoading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      // Logout action
      logout: () => {
        clearAuthTokens();
        set({ 
          user: null, 
          company: null,
          subscription: null,
          isLoading: false, 
          error: null,
          isInitialized: true
        });
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      },

      // Check authentication status
      checkAuth: async () => {
        if (!get().isInitialized) {
          set({ isLoading: true });
          console.log('authStore: checkAuth - Initializing...');
        }

        try {
          if (!isAuthenticated()) {
            console.log('authStore: checkAuth - Not authenticated, throwing error.');
            throw new Error('Not authenticated');
          }
          
          console.log('authStore: checkAuth - Authenticated, fetching profile and company info.');
          const user = await userApi.getProfile();
          const companyInfo = await userApi.getCompanyInfo();

          console.log('authStore: checkAuth - Fetched user:', user);
          console.log('authStore: checkAuth - Fetched company info:', companyInfo);

          set({ 
            user,
            company: companyInfo.company,
            subscription: user.subscription, // Directly use subscription from user profile
            isLoading: false, 
            isInitialized: true,
            error: null 
          });
          console.log('authStore: checkAuth - State updated.');
          
        } catch (error: any) {
          console.error('authStore: checkAuth failed:', error.message);
          clearAuthTokens();
          set({ 
            user: null, 
            company: null,
            subscription: null,
            isLoading: false, 
            isInitialized: true,
            error: null
          });
        }
      },

      // Update profile action
      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userApi.updateProfile(data);
          set({ user: response.user, isLoading: false, error: null });
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          set({ isLoading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      // Clear error action
      clearError: () => set({ error: null }),

      // Set loading action
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user,
        company: state.company,
        subscription: state.subscription
      }),
    }
  )
);

// Helper hooks for common use cases
export const useAuth = () => {
  const state = useAuthStore();
  
  return {
    ...state,
    isAuthenticated: !!state.user,
    // Permissions are now directly from the subscription object
    hasMarketplaceAccess: state.subscription?.marketplace_access ?? false,
    hasDynamicPricing: state.subscription?.dynamic_pricing ?? false,
    hasCustomerManagementAccess: state.subscription?.customer_management_access ?? false,
    hasFullDashboardAccess: state.subscription?.full_dashboard_access ?? false,
    hasInventoryManagementAccess: state.subscription?.inventory_management_access ?? false,
  };
};

export const useAuthActions = () => useAuthStore(
  (state) => ({
    login: state.login,
    register: state.register,
    logout: state.logout,
    checkAuth: state.checkAuth,
    updateProfile: state.updateProfile,
    clearError: state.clearError,
    setLoading: state.setLoading,
  })
);

export const useUser = () => useAuthStore((state) => state.user);