import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth, useAuthActions } from '@/store/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireMarketplace?: boolean;
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requireMarketplace = false,
  redirectTo,
}) => {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    isInitialized,
    hasMarketplaceAccess 
  } = useAuth();
  const { checkAuth } = useAuthActions();

  useEffect(() => {
    // Initialize auth check if not already done
    if (!isInitialized && !isLoading) {
      checkAuth();
    }
  }, [isInitialized, isLoading, checkAuth]);

  useEffect(() => {
    // Skip redirect logic during loading or before initialization
    if (isLoading || !isInitialized) {
      return;
    }

    // Handle authentication requirements
    if (requireAuth && !isAuthenticated) {
      const returnUrl = router.asPath;
      const loginUrl = redirectTo || `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;
      router.replace(loginUrl);
      return;
    }

    // Handle marketplace access requirements
    if (requireMarketplace && isAuthenticated && !hasMarketplaceAccess) {
      router.replace('/dashboard?error=marketplace_access_required');
      return;
    }

    // Handle already authenticated users trying to access auth pages
    if (!requireAuth && isAuthenticated) {
      const returnUrl = router.query.returnUrl as string;
      const dashboardUrl = returnUrl && returnUrl !== '/auth/login' && returnUrl !== '/auth/register' 
        ? returnUrl 
        : '/dashboard';
      router.replace(dashboardUrl);
      return;
    }
  }, [
    isAuthenticated,
    isLoading,
    isInitialized,
    requireAuth,
    requireMarketplace,
    hasMarketplaceAccess,
    router,
    redirectTo,
  ]);

  // Show loading spinner during initialization or auth checks
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Don't render children if auth requirements are not met
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireMarketplace && !hasMarketplaceAccess) {
    return null;
  }

  // Don't render auth pages if user is already authenticated
  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;