import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Plus, 
  X, 
  ArrowRight, 
  ArrowLeft,
  User,
  Building,
  Users,
  CreditCard,
  Crown
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth, useAuthActions } from '@/store/authStore';
import { companyApi, Wholesaler, subscriptionsApi, SubscriptionPlan } from '@/lib/api';
import { registerSchema, RegisterFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { error, isLoading } = useAuth();
  const { register: registerUser, clearError } = useAuthActions();
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  
  // Form state
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
    trigger,
    getValues,
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
      accept_terms: false,
    },
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load subscription plans
        setIsLoadingPlans(true);
        const plansData = await subscriptionsApi.getSubscriptionPlans();
        const plansWithExtras = plansData.map((plan: any) => ({
          ...plan,
          popular: plan.plan_type === 'pro_plus',
          cta: plan.plan_type === 'pro' ? '14 Gün Ücretsiz Dene' : 
               plan.plan_type === 'ultra' ? 'Hemen Başla' : 'Planı Seç'
        }));
        setPlans(plansWithExtras);
        setIsLoadingPlans(false);

        // Load wholesalers (for ULTRA plan)
        const wholesalersData = await companyApi.getWholesalers();
        setWholesalers(Array.isArray(wholesalersData) ? wholesalersData : []);
      } catch (error) {
        console.error('Failed to load data:', error);
        setIsLoadingPlans(false);
      }
    };

    loadData();
  }, []);

  // Step configuration
  const steps = [
    { id: 1, name: 'Kişisel Bilgiler', icon: User },
    { id: 2, name: 'Şirket Bilgileri', icon: Building },
    { id: 3, name: 'Plan Seçimi', icon: CreditCard },
    // ULTRA plan seçilirse toptancı ilişkileri adımı eklenir
    ...(selectedPlan?.plan_type === 'ultra' ? [{ id: 4, name: 'Toptancı İlişkileri', icon: Users }] : [])
  ];

  const maxSteps = selectedPlan?.plan_type === 'ultra' ? 4 : 3;

  const addWholesaler = () => {
    setSelectedWholesalers([
      ...selectedWholesalers,
      {
        id: Date.now(),
        wholesaler_id: '',
        notes: '',
        discount_rate: '', // Özel iskonto alanı
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

  const nextStep = async () => {
    let fieldsToValidate: string[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['first_name', 'last_name', 'email', 'password', 'password_confirm'];
        break;
      case 2:
        fieldsToValidate = ['company_name'];
        break;
      case 3:
        if (!selectedPlan) {
          alert('Lütfen bir plan seçin');
          return;
        }
        break;
    }

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError();
      clearErrors();
      setSuccessMessage('');

      // Prepare wholesaler relations for ULTRA plan
      const wholesaler_relations = selectedPlan?.plan_type === 'ultra' 
        ? selectedWholesalers
            .filter(w => w.wholesaler_id)
            .map(w => ({
              wholesaler_id: parseInt(w.wholesaler_id),
              notes: w.notes || '',
              discount_rate: w.discount_rate ? parseFloat(w.discount_rate) : undefined,
            }))
        : [];

      const registrationData = {
        ...data,
        wholesaler_relations,
        selected_plan_id: selectedPlan?.id,
      };

      await registerUser(registrationData);
      
      setSuccessMessage('Kayıt başarılı! Dashboard\'a yönlendiriliyorsunuz...');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Size Uygun Planı Seçin
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                İşletmenizin ihtiyaçlarına en uygun planı seçin.
              </p>

              {isLoadingPlans ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg",
                        selectedPlan?.id === plan.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 bg-white hover:border-primary-200"
                      )}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                            <Crown className="h-3 w-3 inline mr-1" />
                            En Popüler
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {plan.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {plan.description}
                        </p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">
                            ₺{plan.monthly_price}
                          </span>
                          <span className="text-gray-600">/ay</span>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-start text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-center">
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2",
                          selectedPlan?.id === plan.id
                            ? "bg-primary-600 border-primary-600"
                            : "border-gray-300"
                        )}>
                          {selectedPlan?.id === plan.id && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Toptancı İlişkileri
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    ULTRA planıyla toptancılarınızla özel anlaşmalar yapabilirsiniz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addWholesaler}
                  className="btn btn-outline btn-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Toptancı Ekle
                </button>
              </div>

              {selectedWholesalers.length > 0 ? (
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
                          <label className="form-label">Toptancı *</label>
                          <select
                            value={wholesaler.wholesaler_id}
                            onChange={(e) => updateWholesaler(wholesaler.id, 'wholesaler_id', e.target.value)}
                            className="form-input"
                            required
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
                          <label className="form-label">Özel İskonto (%)</label>
                          <input
                            type="number"
                            value={wholesaler.discount_rate}
                            onChange={(e) => updateWholesaler(wholesaler.id, 'discount_rate', e.target.value)}
                            className="form-input"
                            placeholder="5"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>

                        <div className="md:col-span-2">
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
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm">
                    Henüz toptancı eklenmedi. En az bir toptancı eklemeniz gerekiyor.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <Head>
        <title>Kayıt Ol - Tyrex B2B</title>
        <meta name="description" content="Tyrex B2B platformuna kayıt olun" />
      </Head>

      <Layout showSidebar={false} showHeader={false}>
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">tyreX</span>
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

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2",
                      currentStep >= step.id
                        ? "bg-primary-600 border-primary-600"
                        : "bg-white border-gray-300"
                    )}>
                      <step.icon className={cn(
                        "h-5 w-5",
                        currentStep >= step.id ? "text-white" : "text-gray-400"
                      )} />
                    </div>
                    <div className="ml-3">
                      <p className={cn(
                        "text-sm font-medium",
                        currentStep >= step.id ? "text-primary-600" : "text-gray-500"
                      )}>
                        {step.name}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "w-12 h-0.5 mx-4",
                        currentStep > step.id ? "bg-primary-600" : "bg-gray-300"
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              {/* Success Message */}
              {successMessage && (
                <div className="p-6 border-b border-gray-200">
                  <div className="bg-success-50 border border-success-200 rounded-md p-4">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-success-400" />
                      <div className="ml-3">
                        <p className="text-sm text-success-700">{successMessage}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-6 border-b border-gray-200">
                  <div className="bg-error-50 border border-error-200 rounded-md p-4">
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
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step Content */}
                <div className="p-6">
                  {renderStepContent()}
                </div>

                {/* Terms and Conditions - shown on last step */}
                {currentStep === maxSteps && (
                  <div className="px-6 pb-4">
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
                      <p className="form-error mt-2">{errors.accept_terms.message}</p>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="btn btn-outline"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri
                      </button>
                    )}
                  </div>

                  <div>
                    {currentStep < maxSteps ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="btn btn-primary"
                      >
                        Devam Et
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting || isLoading || (selectedPlan?.plan_type === 'ultra' && selectedWholesalers.length === 0)}
                        className="btn btn-primary"
                      >
                        {isSubmitting || isLoading ? (
                          <>
                            <LoadingSpinner size="sm" color="white" className="mr-2" />
                            Kayıt oluşturuluyor...
                          </>
                        ) : (
                          `${selectedPlan?.cta || 'Kayıt Ol'}`
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Plan Info */}
            {selectedPlan && currentStep === 3 && (
              <div className="mt-6 bg-primary-50 border border-primary-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-primary-800 mb-2">
                  Seçilen Plan: {selectedPlan.name} - ₺{selectedPlan.monthly_price}/ay
                </h4>
                <ul className="text-sm text-primary-700 space-y-1">
                  {selectedPlan.plan_type === 'pro' && (
                    <>
                      <li>✓ 14 gün ücretsiz deneme</li>
                      <li>✓ Stok ve depo yönetimi</li>
                      <li>✓ Temel raporlama</li>
                    </>
                  )}
                  {selectedPlan.plan_type === 'pro_plus' && (
                    <>
                      <li>✓ Tüm PRO özellikleri</li>
                      <li>✓ Müşteri takip sistemi</li>
                      <li>✓ Lastik otel yönetimi</li>
                      <li>✓ Gelişmiş raporlama</li>
                    </>
                  )}
                  {selectedPlan.plan_type === 'ultra' && (
                    <>
                      <li>✓ Tüm PRO PLUS özellikleri</li>
                      <li>✓ Pazaryeri erişimi</li>
                      <li>✓ Kendi ürünlerinizi satma</li>
                      <li>✓ Toptancılarla özel anlaşmalar</li>
                    </>
                  )}
                  <li>✓ İstediğiniz zaman iptal edin</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default RegisterPage;