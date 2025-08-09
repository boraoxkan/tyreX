import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle, ExternalLink } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth, useAuthActions } from '@/store/authStore';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';
import { siteSettingsApi, LoginPageBanner } from '@/lib/api';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { error, isLoading } = useAuth();
  const { login, clearError } = useAuthActions();
  const [showPassword, setShowPassword] = useState(false);
  const [banners, setBanners] = useState<LoginPageBanner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Load banners
  useEffect(() => {
    const loadBanners = async () => {
      try {
        setBannersLoading(true);
        const fetchedBanners = await siteSettingsApi.getLoginBanners();
        setBanners(fetchedBanners);
      } catch (error) {
        console.error('Failed to load login banners:', error);
        // Banner yüklenemese bile sayfanın çalışması için fallback banner
        setBanners([{
          id: 0,
          title: 'B2B Tire Marketplace',
          subtitle: "Türkiye'nin en büyük lastik pazaryerine hoş geldiniz",
          description: '',
          background_color: 'from-primary-600 to-primary-800',
          is_active: true,
          link_url: '',
          link_text: ''
        }]);
      } finally {
        setBannersLoading(false);
      }
    };

    loadBanners();
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      clearErrors();
      
      console.log('Attempting login...');
      await login(data);
      console.log('Login function completed.');
      
      // Redirect to return URL or dashboard
      const returnUrl = router.query.returnUrl as string;
      const redirectUrl = returnUrl && returnUrl !== '/auth/login' 
        ? returnUrl 
        : '/dashboard';
      
      console.log('Redirecting to:', redirectUrl);
      router.push(redirectUrl);
    } catch (error) {
      // Error is handled by the store
      console.error('Login failed:', error);
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <Head>
        <title>Giriş Yap - Tyrex B2B</title>
        <meta name="description" content="Tyrex B2B platformuna giriş yapın" />
      </Head>

      <Layout showSidebar={false} showHeader={false}>
        <div className="min-h-screen flex">
          {/* Left side - Form */}
          <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
            <div className="mx-auto w-full max-w-sm lg:w-96">
              <div>
                <Link href="/" className="flex items-center space-x-2 mb-8">
                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">T</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">tyreX</span>
                </Link>
                
                <h2 className="text-3xl font-bold text-gray-900">
                  Hesabınıza giriş yapın
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Henüz hesabınız yok mu?{' '}
                  <Link 
                    href="/auth/register" 
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Kayıt olun
                  </Link>
                </p>
              </div>

              <div className="mt-8">
                {/* Error Alert */}
                {error && (
                  <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-error-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-error-800">
                          Giriş Başarısız
                        </h3>
                        <p className="mt-1 text-sm text-error-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="form-label">
                      E-posta adresi
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      className={cn(
                        'form-input',
                        errors.email && 'form-input-error'
                      )}
                      placeholder="ornek@email.com"
                    />
                    {errors.email && (
                      <p className="form-error">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="form-label">
                      Şifre
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        {...register('password')}
                        className={cn(
                          'form-input pr-10',
                          errors.password && 'form-input-error'
                        )}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="form-error">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Remember me & Forgot password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                        Beni hatırla
                      </label>
                    </div>

                    <div className="text-sm">
                      <Link
                        href="/auth/forgot-password"
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        Şifrenizi mi unuttunuz?
                      </Link>
                    </div>
                  </div>

                  {/* Submit button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="btn btn-primary w-full flex justify-center py-3"
                    >
                      {isSubmitting || isLoading ? (
                        <>
                          <LoadingSpinner size="sm" color="white" className="mr-2" />
                          Giriş yapılıyor...
                        </>
                      ) : (
                        'Giriş Yap'
                      )}
                    </button>
                  </div>

                  {/* Demo accounts */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <p className="text-sm text-gray-600 mb-3">Demo hesaplar:</p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded border border-gray-200">
                        <strong>Admin Hesabı (Django Admin Paneli):</strong> admin@tyrex.com / admin123
                        <div className="text-gray-600 font-medium">Sadece Django Admin paneli için kullanılır.</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                        <strong>PRO Plan (14 Gün Deneme):</strong> pro@guvenotolastik.com / demo123
                        <div className="text-blue-600 font-medium">Stok ve depo yönetimi - Demo PRO Lastik Mağazası</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <strong>PRO PLUS Plan (Popüler):</strong> proplus@demolastik.com / demo123
                        <div className="text-green-600 font-medium">Müşteri takibi, lastik otel - Demo PRO PLUS Lastik Center</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded border border-purple-200">
                        <strong>ULTRA Plan (Tam Erişim):</strong> ultra@megalastikmerkezi.com / demo123
                        <div className="text-purple-600 font-medium">Pazaryeri + satış - Demo ULTRA Lastik Empire</div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right side - Dynamic Banner */}
          <div className="hidden lg:block relative w-0 flex-1">
            {bannersLoading ? (
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800">
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner size="lg" color="white" />
                </div>
              </div>
            ) : banners.length > 0 ? (
              <div className={`absolute inset-0 bg-gradient-to-br ${banners[0].background_color}`}>
                <div className="flex items-center justify-center h-full p-12">
                  <div className="text-center text-white">
                    {banners[0].image && (
                      <div className="mb-6">
                        <img 
                          src={banners[0].image} 
                          alt={banners[0].title}
                          className="max-w-md max-h-48 mx-auto object-contain"
                        />
                      </div>
                    )}
                    <h1 className="text-4xl font-bold mb-6">
                      {banners[0].title}
                    </h1>
                    {banners[0].subtitle && (
                      <p className="text-xl opacity-90 mb-8">
                        {banners[0].subtitle}
                      </p>
                    )}
                    {banners[0].description && (
                      <div className="text-sm opacity-80 mb-8 max-w-md mx-auto">
                        {banners[0].description.split('\n').map((line, index) => (
                          <p key={index} className="mb-2">{line}</p>
                        ))}
                      </div>
                    )}
                    {banners[0].link_url && banners[0].link_text && (
                      <a
                        href={banners[0].link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors"
                      >
                        {banners[0].link_text}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    )}
                    <div className="grid grid-cols-1 gap-6 max-w-md mx-auto mt-8">
                      <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                        <h3 className="font-semibold mb-2">🏪 Pazaryeri Erişimi</h3>
                        <p className="text-sm opacity-90">
                          Binlerce lastik çeşidine anında erişim
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                        <h3 className="font-semibold mb-2">💰 Dinamik Fiyatlandırma</h3>
                        <p className="text-sm opacity-90">
                          İlişkinize özel indirimli fiyatlar
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                        <h3 className="font-semibold mb-2">🚀 Hızlı Sipariş</h3>
                        <p className="text-sm opacity-90">
                          3 tıkla sipariş, otomatik faturalama
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800">
                <div className="flex items-center justify-center h-full p-12">
                  <div className="text-center text-white">
                    <h1 className="text-4xl font-bold mb-6">
                      B2B Tire Marketplace
                    </h1>
                    <p className="text-xl opacity-90 mb-8">
                      Türkiye&apos;nin en büyük lastik pazaryerine hoş geldiniz
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default LoginPage;