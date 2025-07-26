// frontend/src/components/auth/AuthGuard.tsx - TAM DÜZELTİLMİŞ DOSYA
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, useAuthActions } from '@/store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireMarketplace?: boolean;
  requireDynamicPricing?: boolean;
  requireAuth?: boolean; // YENİ EKLENDİ
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireMarketplace = false,
  requireDynamicPricing = false,
  requireAuth = true, // YENİ EKLENDİ - Varsayılan true
  redirectTo = '/auth/login' 
}) => {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    isInitialized,
    hasMarketplaceAccess,
    hasDynamicPricing
  } = useAuth();
  const { checkAuth } = useAuthActions();

  useEffect(() => {
    // Check auth on mount if not initialized
    if (!isInitialized && !isLoading) {
      checkAuth();
    }
  }, [isInitialized, isLoading, checkAuth]);

  useEffect(() => {
    // Wait for initialization to complete
    if (!isInitialized || isLoading) {
      return;
    }

    console.log('🔍 AuthGuard check:', {
      requireAuth,
      isAuthenticated,
      requireMarketplace,
      hasMarketplaceAccess,
      currentPath: router.asPath
    });

    // YENİ: Eğer auth gerekli değilse ve user login olmamışsa, children'ı render et
    if (!requireAuth && !isAuthenticated) {
      console.log('✅ Auth not required and user not authenticated - render children');
      return;
    }

    // YENİ: Eğer auth gerekli değilse ve user login olmışsa, dashboard'a yönlendir
    if (!requireAuth && isAuthenticated) {
      console.log('🔄 Auth not required but user authenticated - redirect to dashboard');
      router.replace('/dashboard');
      return;
    }

    // ESKİ MANTIK: Auth gerekli ve user login olmamışsa, login'e yönlendir
    if (requireAuth && !isAuthenticated) {
      console.log('🔄 Auth required but user not authenticated - redirect to login');
      const currentPath = router.asPath;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.replace(loginUrl);
      return;
    }

    // Check marketplace access requirement
    if (requireMarketplace && !hasMarketplaceAccess) {
      console.warn('⚠️ Marketplace access required but not available');
      return;
    }

    // Check dynamic pricing requirement
    if (requireDynamicPricing && !hasDynamicPricing) {
      console.warn('⚠️ Dynamic pricing access required but not available');
      return;
    }

  }, [
    isInitialized, 
    isLoading, 
    isAuthenticated, 
    hasMarketplaceAccess,
    hasDynamicPricing,
    requireAuth, // YENİ EKLENDİ
    requireMarketplace, 
    requireDynamicPricing,
    router, 
    redirectTo
  ]);

  // Show loading spinner while checking auth
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // YENİ: Auth gerekli değil ve user login olmamış - children render et
  if (!requireAuth && !isAuthenticated) {
    return <>{children}</>;
  }

  // YENİ: Auth gerekli değil ama user login olmuş - yönlendirme ekranı göster
  if (!requireAuth && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Dashboard'a yönlendiriliyor...</p>
        </div>
      </div>
    );
  }

  // ESKİ MANTIK: Auth gerekli ama user login olmamış - yönlendirme ekranı
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Giriş sayfasına yönlendiriliyor...</p>
        </div>
      </div>
    );
  }

  // ESKİ MANTIK: Tüm kontroller geçti - children render et
  return <>{children}</>;
};

export default AuthGuard;