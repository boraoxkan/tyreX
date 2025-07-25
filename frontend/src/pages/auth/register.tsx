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