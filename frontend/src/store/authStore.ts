// frontend/src/store/authStore.ts - Complete fixed version
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  authApi, 
  userApi, 
  User, 
  Company,
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
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Subscription info
  subscription: {
    plan: string | null;
    status: string | null;
    marketplace_access: boolean;
    dynamic_pricing: boolean;
    trial_end_date: string | null;
  } | null;
  
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
      isLoading: false,
      isInitialized: false,
      error: null,
      subscription: null,

      // Login action
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });
          
          console.log('🔐 Logging in user:', credentials.email);
          
          const response = await authApi.login(credentials);
          
          console.log('Login response:', response);
          
          // Check if response has the expected structure
          if (!response.access || !response.refresh) {
            throw new Error('Invalid login response: missing tokens');
          }
          
          // Store tokens
          setAuthTokens(response.access, response.refresh);
          
          // The user data might be in response.user or just response
          const userData = response.user || response;
          
          if (!userData || !userData.email) {
            // If no user data in login response, fetch it separately
            try {
              const userProfile = await userApi.getProfile();
              set({ 
                user: userProfile,
                isLoading: false,
                error: null 
              });
            } catch (profileError) {
              console.error('Failed to fetch user profile after login:', profileError);
              throw new Error('Login successful but failed to fetch user profile');
            }
          } else {
            set({ 
              user: userData,
              isLoading: false,
              error: null 
            });
          }
          
          // Fetch additional user data
          await get().checkAuth();
          
          console.log('✅ Login successful');
          
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          console.error('❌ Login failed:', errorMessage, error);
          
          // Clear any stored tokens on failure
          clearAuthTokens();
          
          set({ 
            user: null, 
            company: null,
            subscription: null,
            isLoading: false, 
            error: errorMessage 
          });
          
          throw new Error(errorMessage);
        }
      },

      // Register action
      register: async (data: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });
          
          console.log('📝 Registering user:', data.email);
          
          const response = await authApi.register(data);
          
          console.log('Registration response:', response);
          
          // After successful registration, automatically login
          await get().login({
            email: data.email,
            password: data.password
          });
          
          console.log('✅ Registration successful:', response.message);
          
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          console.error('❌ Registration failed:', errorMessage, error);
          
          set({ 
            user: null, 
            company: null,
            subscription: null,
            isLoading: false, 
            error: errorMessage 
          });
          
          throw new Error(errorMessage);
        }
      },

      // Logout action
      logout: () => {
        console.log('🚪 Logging out user');
        
        clearAuthTokens();
        
        set({ 
          user: null, 
          company: null,
          subscription: null,
          isLoading: false, 
          error: null,
          isInitialized: true
        });
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      },

      // Check authentication status
      checkAuth: async () => {
        try {
          set({ isLoading: true });
          
          if (!isAuthenticated()) {
            set({ 
              user: null, 
              company: null,
              subscription: null,
              isLoading: false, 
              isInitialized: true 
            });
            return;
          }
          
          console.log('🔍 Checking authentication status');
          
          // Fetch user profile
          const user = await userApi.getProfile();
          
          if (!user || !user.email) {
            throw new Error('Invalid user profile data');
          }
          
          // Fetch company info
          let company = null;
          let subscription = null;
          
          try {
            const companyData = await userApi.getCompanyInfo();
            company = companyData.company;
            
            // Set subscription info based on company or user data
            if (company) {
              subscription = {
                plan: 'Temel Plan', // This should come from API
                status: 'trialing', // This should come from API
                marketplace_access: true, // This should come from API
                dynamic_pricing: true, // This should come from API
                trial_end_date: null // This should come from API
              };
            }
          } catch (companyError) {
            console.warn('⚠️ Could not fetch company info:', companyError);
            // Don't throw here, just continue without company info
          }
          
          set({ 
            user,
            company,
            subscription,
            isLoading: false, 
            isInitialized: true,
            error: null 
          });
          
          console.log('✅ Auth check successful:', user.email);
          
        } catch (error: any) {
          console.error('❌ Auth check failed:', error);
          
          // If auth check fails, clear tokens and redirect
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
        try {
          set({ isLoading: true, error: null });
          
          console.log('👤 Updating user profile');
          
          const response = await userApi.updateProfile(data);
          
          set({ 
            user: response.user,
            isLoading: false,
            error: null 
          });
          
          console.log('✅ Profile updated successfully');
          
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          console.error('❌ Profile update failed:', errorMessage);
          
          set({ 
            isLoading: false, 
            error: errorMessage 
          });
          
          throw new Error(errorMessage);
        }
      },

      // Clear error action
      clearError: () => {
        set({ error: null });
      },

      // Set loading action
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist user and company data, not loading states
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
  const { user, company, subscription, isLoading, error, isInitialized } = useAuthStore();
  
  return {
    user,
    company,
    subscription,
    isLoading,
    error,
    isInitialized,
    isAuthenticated: !!user,
    hasMarketplaceAccess: subscription?.marketplace_access || false,
    hasDynamicPricing: subscription?.dynamic_pricing || false,
  };
};

export const useAuthActions = () => {
  const { login, register, logout, checkAuth, updateProfile, clearError, setLoading } = useAuthStore();
  
  return {
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    clearError,
    setLoading,
  };
};