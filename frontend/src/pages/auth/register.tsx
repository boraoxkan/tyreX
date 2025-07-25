import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle, CheckCircle, Plus, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth, useAuthActions } from '@/store/authStore';
import { companyApi, Wholesaler } from '@/lib/api';
import { registerSchema, RegisterFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { error, isLoading } = useAuth();
  const { register: registerUser, clearError } = useAuthActions();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [selectedWholesalers, setSelectedWholesalers] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      password_confirm: '',
      first_name: '',
      last_name: '',
      company_name: '',
      company_phone: '',
      company_address: '',
      payment_terms_days: 30,
      accept_terms: false,
    },
  });

  // Load wholesalers on component mount
  useEffect(() => {
    const loadWholesalers = async () => {
      try {
        const data = await companyApi.getWholesalers();
        setWholesalers(data);
      } catch (error) {
        console.error('Failed to load wholesalers:', error);
      }
    };

    loadWholesalers();
  }, []);

  const addWholesaler = () => {
    setSelectedWholesalers([
      ...selectedWholesalers,
      {
        id: Date.now(),
        wholesaler_id: '',
        credit_limit: '',
        payment_terms_days: 30,
        notes: '',
      },
    ]);
  };

  const removeWholesaler = (id: number) => {
    setSelectedWholesalers(selectedWholesalers.filter(w => w.id !== id));
  };

  const updateWholesaler = (id: number, field: string, value: any) => {
    setSelectedWholesalers(selectedWholesalers.map(w => 
      w.id === id ? { ...w, [field]: value } : w
    ));
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError();
      clearErrors();
      setSuccessMessage('');

      // Prepare wholesaler relations
      const wholesaler_relations = selectedWholesalers
        .filter(w => w.wholesaler_id)
        .map(w => ({
          wholesaler_id: parseInt(w.wholesaler_id),
          credit_limit: w.credit_limit ? parseFloat(w.credit_limit) : undefined,
          payment_terms_days: w.payment_terms_days || 30,
          notes: w.notes || '',
        }));

      const registrationData = {
        ...data,
        wholesaler_relations,
      };

      await registerUser(registrationData);
      
      setSuccessMessage('Kayıt başarılı! 7 günlük ücretsiz deneme başlatıldı. Dashboard\'a yönlendiriliyorsunuz...');
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <Head>
        <title>Kayıt Ol - Tyrex B2B</title>
        <meta name="description" content="Tyrex B2B platformuna kayıt olun ve 7 günlük ücretsiz deneme başlatın" />
      </Head>

      <Layout showSidebar={false} showHeader={false}>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">Tyrex B2B</span>
              </Link>
              
              <h2 className="text-3xl font-bold text-gray-900">
                Perakendeci Olarak Kayıt Ol
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Zaten hesabınız var mı?{' '}
                <Link 
                  href="/auth/login" 
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Giriş yapın
                </Link>
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-md">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-success-400" />
                    <div className="ml-3">
                      <p className="text-sm text-success-700">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-error-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-error-800">
                        Kayıt Başarısız
                      </h3>
                      <p className="mt-1 text-sm text-error-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Kişisel Bilgiler
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="first_name" className="form-label">
                        Ad *
                      </label>
                      <input
                        id="first_name"
                        type="text"
                        {...register('first_name')}
                        className={cn(
                          'form-input',
                          errors.first_name && 'form-input-error'
                        )}
                        placeholder="Adınız"
                      />
                      {errors.first_name && (
                        <p className="form-error">{errors.first_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="last_name" className="form-label">
                        Soyad *
                      </label>
                      <input
                        id="last_name"
                        type="text"
                        {...register('last_name')}
                        className={cn(
                          'form-input',
                          errors.last_name && 'form-input-error'
                        )}
                        placeholder="Soyadınız"
                      />
                      {errors.last_name && (
                        <p className="form-error">{errors.last_name.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="email" className="form-label">
                        E-posta *
                      </label>
                      <input
                        id="email"
                        type="email"
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

                    <div>
                      <label htmlFor="password" className="form-label">
                        Şifre *
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
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

                    <div>
                      <label htmlFor="password_confirm" className="form-label">
                        Şifre Tekrar *
                      </label>
                      <div className="relative">
                        <input
                          id="password_confirm"
                          type={showPasswordConfirm ? 'text' : 'password'}
                          {...register('password_confirm')}
                          className={cn(
                            'form-input pr-10',
                            errors.password_confirm && 'form-input-error'
                          )}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        >
                          {showPasswordConfirm ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {errors.password_confirm && (
                        <p className="form-error">{errors.password_confirm.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Şirket Bilgileri
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="company_name" className="form-label">
                        Şirket Adı *
                      </label>
                      <input
                        id="company_name"
                        type="text"
                        {...register('company_name')}
                        className={cn(
                          'form-input',
                          errors.company_name && 'form-input-error'
                        )}
                        placeholder="Şirket adınız"
                      />
                      {errors.company_name && (
                        <p className="form-error">{errors.company_name.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="company_phone" className="form-label">
                          Şirket Telefonu
                        </label>
                        <input
                          id="company_phone"
                          type="tel"
                          {...register('company_phone')}
                          className={cn(
                            'form-input',
                            errors.company_phone && 'form-input-error'
                          )}
                          placeholder="0532 123 45 67"
                        />
                        {errors.company_phone && (
                          <p className="form-error">{errors.company_phone.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="payment_terms_days" className="form-label">
                          Varsayılan Ödeme Vadesi (Gün)
                        </label>
                        <input
                          id="payment_terms_days"
                          type="number"
                          {...register('payment_terms_days', { valueAsNumber: true })}
                          className={cn(
                            'form-input',
                            errors.payment_terms_days && 'form-input-error'
                          )}
                          placeholder="30"
                          min="1"
                          max="365"
                        />
                        {errors.payment_terms_days && (
                          <p className="form-error">{errors.payment_terms_days.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="company_address" className="form-label">
                        Şirket Adresi
                      </label>
                      <textarea
                        id="company_address"
                        {...register('company_address')}
                        rows={3}
                        className={cn(
                          'form-input',
                          errors.company_address && 'form-input-error'
                        )}
                        placeholder="Şirket adresiniz"
                      />
                      {errors.company_address && (
                        <p className="form-error">{errors.company_address.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wholesaler Relations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Toptancı İlişkileri (Opsiyonel)
                    </h3>
                    <button
                      type="button"
                      onClick={addWholesaler}
                      className="btn btn-outline btn-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Toptancı Ekle
                    </button>
                  </div>

                  {selectedWholesalers.length > 0 && (
                    <div className="space-y-4">
                      {selectedWholesalers.map((wholesaler) => (
                        <div key={wholesaler.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              Toptancı #{selectedWholesalers.indexOf(wholesaler) + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeWholesaler(wholesaler.id)}
                              className="text-error-600 hover:text-error-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="form-label">Toptancı</label>
                              <select
                                value={wholesaler.wholesaler_id}
                                onChange={(e) => updateWholesaler(wholesaler.id, 'wholesaler_id', e.target.value)}
                                className="form-input"
                              >
                                <option value="">Toptancı seçin...</option>
                                {wholesalers.map((w) => (
                                  <option key={w.id} value={w.id}>
                                    {w.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="form-label">Kredi Limiti (₺)</label>
                              <input
                                type="number"
                                value={wholesaler.credit_limit}
                                onChange={(e) => updateWholesaler(wholesaler.id, 'credit_limit', e.target.value)}
                                className="form-input"
                                placeholder="50000"
                                min="0"
                              />
                            </div>

                            <div>
                              <label className="form-label">Ödeme Vadesi (Gün)</label>
                              <input
                                type="number"
                                value={wholesaler.payment_terms_days}
                                onChange={(e) => updateWholesaler(wholesaler.id, 'payment_terms_days', parseInt(e.target.value))}
                                className="form-input"
                                placeholder="30"
                                min="1"
                                max="365"
                              />
                            </div>

                            <div>
                              <label className="form-label">Notlar</label>
                              <input
                                type="text"
                                value={wholesaler.notes}
                                onChange={(e) => updateWholesaler(wholesaler.id, 'notes', e.target.value)}
                                className="form-input"
                                placeholder="Özel notlar..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedWholesalers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">
                        Henüz toptancı eklenmedi. Daha sonra ayarlardan ekleyebilirsiniz.
                      </p>
                    </div>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div>
                  <div className="flex items-center">
                    <input
                      id="accept_terms"
                      type="checkbox"
                      {...register('accept_terms')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="accept_terms" className="ml-2 block text-sm text-gray-900">
                      <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                        Kullanım Koşulları
                      </Link>
                      {' '}ve{' '}
                      <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                        Gizlilik Politikası
                      </Link>
                      'nı okudum ve kabul ediyorum. *
                    </label>
                  </div>
                  {errors.accept_terms && (
                    <p className="form-error">{errors.accept_terms.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="btn btn-primary w-full flex justify-center py-3"
                  >
                    {isSubmitting || isLoading ? (
                      <>
                        <LoadingSpinner size="sm" color="white" className="mr-2" />
                        Kayıt oluşturuluyor...
                      </>
                    ) : (
                      '7 Gün Ücretsiz Deneme Başlat'
                    )}
                  </button>
                </div>

                {/* Additional Info */}
                <div className="bg-primary-50 border border-primary-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-primary-800 mb-2">
                    7 Günlük Ücretsiz Deneme
                  </h4>
                  <ul className="text-sm text-primary-700 space-y-1">
                    <li>✓ Pazaryerine tam erişim</li>
                    <li>✓ Dinamik fiyatlandırma</li>
                    <li>✓ Sınırsız sipariş</li>
                    <li>✓ Kredi kartı gerekmiyor</li>
                    <li>✓ İstediğiniz zaman iptal edin</li>
                  </ul>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default RegisterPage;