import React from 'react';
import Link from 'next/link';
import { Shield, CreditCard, ArrowRight } from 'lucide-react';
import { useAuth } from '@/store/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPermission: 'inventory_management' | 'customer_management' | 'full_dashboard' | 'marketplace';
  fallbackMessage?: string;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  requiredPermission,
  fallbackMessage
}) => {
  const { 
    isLoading, 
    isInitialized, 
    hasInventoryManagementAccess,
    hasCustomerManagementAccess,
    hasFullDashboardAccess,
    hasMarketplaceAccess,
    subscription
  } = useAuth();

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check permissions
  let hasAccess = false;
  let upgradeMessage = fallbackMessage;
  let requiredPlan = '';
  let requiredPrice = '';

  switch (requiredPermission) {
    case 'inventory_management':
      hasAccess = hasInventoryManagementAccess;
      upgradeMessage = upgradeMessage || 'Stok ve depo yönetimi özelliğine erişmek için PRO aboneliği gereklidir.';
      requiredPlan = 'PRO';
      requiredPrice = '300₺/ay';
      break;
    case 'customer_management':
      hasAccess = hasCustomerManagementAccess;
      upgradeMessage = upgradeMessage || 'Müşteri takibi özelliğine erişmek için PRO PLUS aboneliği gereklidir.';
      requiredPlan = 'PRO PLUS';
      requiredPrice = '750₺/ay';
      break;
    case 'full_dashboard':
      hasAccess = hasFullDashboardAccess;
      upgradeMessage = upgradeMessage || 'Bu özelliğe erişmek için PRO PLUS aboneliği gereklidir.';
      requiredPlan = 'PRO PLUS';
      requiredPrice = '750₺/ay';
      break;
    case 'marketplace':
      hasAccess = hasMarketplaceAccess;
      upgradeMessage = upgradeMessage || 'Pazaryeri erişimi için ULTRA aboneliği gereklidir.';
      requiredPlan = 'ULTRA';
      requiredPrice = '4500₺/ay';
      break;
    default:
      hasAccess = false;
  }

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show upgrade prompt
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center space-y-6">
      <div className="p-4 bg-primary-100 rounded-full">
        <Shield className="h-12 w-12 text-primary-600" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">
          Abonelik Yükseltmesi Gerekli
        </h3>
        <p className="text-gray-600 max-w-md">
          {upgradeMessage}
        </p>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700">
          <CreditCard className="h-4 w-4 mr-2" />
          {requiredPlan} - {requiredPrice}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Button
          href="/dashboard/subscription"
          variant="primary"
          icon={<ArrowRight className="h-4 w-4" />}
        >
          Planları Görüntüle
        </Button>
        <Button
          href="/dashboard"
          variant="outline"
        >
          Dashboard'a Dön
        </Button>
      </div>

      {subscription && (
        <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
          Mevcut planınız: <span className="font-medium">{subscription.plan?.name || 'Ücretsiz'}</span>
        </div>
      )}
    </div>
  );
};

export default SubscriptionGuard;