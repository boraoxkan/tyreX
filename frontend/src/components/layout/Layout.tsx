// frontend/src/components/layout/Layout.tsx - Complete updated version
import React, { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  Home, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  Bell,
  Search,
  Warehouse,
  CreditCard,
  Store,
  Users
} from 'lucide-react';
import { useAuth, useAuthActions } from '@/store/authStore';
import { useCart } from '@/store/cartStore'; // Yeni eklendi
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showSidebar?: boolean;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'Tyrex B2B', 
  showSidebar = true, 
  showHeader = true 
}) => {
  const router = useRouter();
  const { user, company, isAuthenticated, hasMarketplaceAccess } = useAuth();
  const { logout } = useAuthActions();
  const { totalItems } = useCart(); // Yeni eklendi
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Navigation items for authenticated users - GÜNCELLENMIŞ
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: router.pathname === '/dashboard',
    },
    {
      name: 'Pazaryeri',
      href: '/dashboard/products', // Güncellendi
      icon: Store, // Icon değiştirildi
      current: router.pathname.startsWith('/dashboard/products'), // Güncellendi
      requiresMarketplace: true,
    },
    {
      name: 'Sepetim', // Yeni eklendi
      href: '/cart',
      icon: ShoppingCart,
      current: router.pathname === '/cart',
      showBadge: true,
    },
    {
      name: 'Siparişlerim', // İsim güncellendi
      href: '/dashboard/orders', // Güncellendi
      icon: Package,
      current: router.pathname.startsWith('/dashboard/orders'), // Güncellendi
    },
    {
      name: 'Stok Yönetimi',
      href: '/dashboard/my-stock',
      icon: Package,
      current: router.pathname.startsWith('/dashboard/my-stock'),
    },
    {
      name: 'Depolarım',
      href: '/dashboard/my-warehouses',
      icon: Warehouse,
      current: router.pathname.startsWith('/dashboard/my-warehouses'),
    },
    {
      name: 'Müşterilerim',
      href: '/dashboard/customers',
      icon: Users,
      current: router.pathname.startsWith('/dashboard/customers'),
      requiresWholesaler: true, // Sadece toptancılar için
    },
    {
      name: 'Abonelik',
      href: '/dashboard/subscription',
      icon: CreditCard,
      current: router.pathname.startsWith('/dashboard/subscription'),
    },
    {
      name: 'Raporlar',
      href: '/reports',
      icon: BarChart3,
      current: router.pathname.startsWith('/reports'),
    },
    {
      name: 'Ayarlar',
      href: '/settings',
      icon: Settings,
      current: router.pathname.startsWith('/settings'),
    },
  ];

  const handleLogout = () => {
    logout();
  };

  const Sidebar = () => (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Sidebar header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Tyrex</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {company?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - GÜNCELLENMIŞ */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          
          // Check if user has marketplace access for marketplace-required items
          const isAccessible = !item.requiresMarketplace || hasMarketplaceAccess;
          
          // Check if user is wholesaler for wholesaler-required items
          const isWholesalerAccessible = !item.requiresWholesaler || (company?.company_type === 'wholesaler' || company?.company_type === 'both');
          
          // Skip item if not accessible
          if (!isWholesalerAccessible) {
            return null;
          }
          
          return (
            <Link
              key={item.name}
              href={isAccessible ? item.href : '#'}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative",
                item.current
                  ? "bg-primary-100 text-primary-700"
                  : isAccessible
                  ? "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  : "text-gray-400 cursor-not-allowed"
              )}
              onClick={(e) => {
                if (!isAccessible) {
                  e.preventDefault();
                  // Redirect to subscription page for marketplace access
                  router.push('/dashboard/subscription');
                } else {
                  setSidebarOpen(false);
                }
              }}
            >
              <Icon className={cn(
                "mr-3 h-5 w-5 flex-shrink-0",
                item.current
                  ? "text-primary-500"
                  : isAccessible
                  ? "text-gray-400 group-hover:text-gray-500"
                  : "text-gray-300"
              )} />
              {item.name}
              
              {/* Sepet Badge - YENİ EKLENDİ */}  
              {item.showBadge && totalItems > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] h-5">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
              
              {!isAccessible && (
                <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  Pro
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );

  const Header = () => (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page title */}
        <div className="flex-1 lg:pl-0">
          <h1 className="text-xl font-semibold text-gray-900 lg:text-2xl">
            {title}
          </h1>
        </div>

        {/* Header actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Ürün ara..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full">
            <Bell className="h-6 w-6" />
          </button>

          {/* Cart button for header - YENİ EKLENDİ */}
          <Link 
            href="/cart"
            className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {/* User menu */}
          <div className="relative">
            <button className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user?.first_name}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  // Public layout (for login, register pages)
  if (!isAuthenticated || !showSidebar) {
    return (
      <div className="min-h-screen bg-gray-50">
        {showHeader && (
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">T</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">Tyrex B2B</span>
                </Link>
                
                <nav className="hidden md:flex space-x-8">
                  <Link href="/" className="text-gray-500 hover:text-gray-900">
                    Anasayfa
                  </Link>
                  <Link href="/about" className="text-gray-500 hover:text-gray-900">
                    Hakkımızda
                  </Link>
                  <Link href="/contact" className="text-gray-500 hover:text-gray-900">
                    İletişim
                  </Link>
                </nav>

                <div className="flex items-center space-x-4">
                  <Link href="/auth/login" className="text-gray-500 hover:text-gray-900">
                    Giriş Yap
                  </Link>
                  <Link href="/auth/register" className="btn btn-primary">
                    Kayıt Ol
                  </Link>
                </div>
              </div>
            </div>
          </header>
        )}
        
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  // Authenticated layout with sidebar
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container-page py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;