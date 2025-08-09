import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  ArrowLeft,
  Save,
  User,
  Building,
  Truck,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
  Warehouse
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { customersApi, Customer } from '@/lib/api';
import { handleApiError } from '@/lib/api';

const NewCustomerPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    customer_type: 'individual' as 'individual' | 'business' | 'fleet',
    email: '',
    phone: '',
    address: '',
    company_name: '',
    tax_number: '',
    customer_code: '',
    credit_limit: '',
    payment_terms_days: '30',
    discount_rate: '0',
    tire_hotel_enabled: false,
    tire_storage_capacity: '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Prepare data for API
      const customerData: Partial<Customer> = {
        name: formData.name,
        customer_type: formData.customer_type,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        company_name: formData.company_name || undefined,
        tax_number: formData.tax_number || undefined,
        customer_code: formData.customer_code || undefined,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : undefined,
        payment_terms_days: parseInt(formData.payment_terms_days),
        discount_rate: parseFloat(formData.discount_rate),
        tire_hotel_enabled: formData.tire_hotel_enabled,
        tire_storage_capacity: formData.tire_storage_capacity ? parseInt(formData.tire_storage_capacity) : undefined,
        notes: formData.notes || undefined
      };

      await customersApi.createCustomer(customerData);
      
      // Redirect to customers list
      router.push('/dashboard/customers');
      
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const customerTypeOptions = [
    { value: 'individual', label: 'Bireysel Müşteri', icon: User },
    { value: 'business', label: 'Kurumsal Müşteri', icon: Building },
    { value: 'fleet', label: 'Filo Müşterisi', icon: Truck }
  ];

  return (
    <AuthGuard>
      <Head>
        <title>Yeni Müşteri - tyreX</title>
        <meta name="description" content="Yeni müşteri ekleme formu" />
      </Head>

      <Layout title="Yeni Müşteri">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Geri
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Yeni Müşteri</h1>
                <p className="text-gray-600">Müşteri bilgilerini girin</p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-medium text-gray-900">Temel Bilgiler</h2>
              </div>
              <div className="card-body space-y-6">
                {/* Customer Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Müşteri Türü *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {customerTypeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <label
                          key={option.value}
                          className={`relative flex items-center p-4 border rounded-lg cursor-pointer hover:border-primary-300 transition-colors ${
                            formData.customer_type === option.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="customer_type"
                            value={option.value}
                            checked={formData.customer_type === option.value}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <Icon className={`h-5 w-5 mr-3 ${
                            formData.customer_type === option.value
                              ? 'text-primary-600'
                              : 'text-gray-400'
                          }`} />
                          <span className={`text-sm font-medium ${
                            formData.customer_type === option.value
                              ? 'text-primary-900'
                              : 'text-gray-900'
                          }`}>
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Müşteri Adı *"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    leftIcon={<User className="h-4 w-4 text-gray-400" />}
                    placeholder="Müşteri adını girin"
                  />

                  <Input
                    label="Müşteri Kodu"
                    name="customer_code"
                    value={formData.customer_code}
                    onChange={handleInputChange}
                    leftIcon={<FileText className="h-4 w-4 text-gray-400" />}
                    placeholder="Örn: CUST001"
                  />
                </div>

                {formData.customer_type !== 'individual' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Şirket Adı"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      leftIcon={<Building className="h-4 w-4 text-gray-400" />}
                      placeholder="Şirket adını girin"
                    />

                    <Input
                      label="Vergi Numarası"
                      name="tax_number"
                      value={formData.tax_number}
                      onChange={handleInputChange}
                      leftIcon={<FileText className="h-4 w-4 text-gray-400" />}
                      placeholder="Vergi numarasını girin"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-medium text-gray-900">İletişim Bilgileri</h2>
              </div>
              <div className="card-body space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="E-posta"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    leftIcon={<Mail className="h-4 w-4 text-gray-400" />}
                    placeholder="ornek@email.com"
                  />

                  <Input
                    label="Telefon"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    leftIcon={<Phone className="h-4 w-4 text-gray-400" />}
                    placeholder="0555 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="Tam adres bilgilerini girin"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Commercial Information */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-medium text-gray-900">Ticari Bilgiler</h2>
              </div>
              <div className="card-body space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Kredi Limiti (₺)"
                    name="credit_limit"
                    type="number"
                    value={formData.credit_limit}
                    onChange={handleInputChange}
                    leftIcon={<CreditCard className="h-4 w-4 text-gray-400" />}
                    placeholder="50000"
                    min="0"
                    step="0.01"
                  />

                  <Input
                    label="Ödeme Vadesi (Gün)"
                    name="payment_terms_days"
                    type="number"
                    value={formData.payment_terms_days}
                    onChange={handleInputChange}
                    leftIcon={<Calendar className="h-4 w-4 text-gray-400" />}
                    placeholder="30"
                    min="0"
                    required
                  />

                  <Input
                    label="İndirim Oranı (%)"
                    name="discount_rate"
                    type="number"
                    value={formData.discount_rate}
                    onChange={handleInputChange}
                    placeholder="5"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Tire Hotel */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-medium text-gray-900">Lastik Oteli</h2>
              </div>
              <div className="card-body space-y-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="tire_hotel_enabled"
                    id="tire_hotel_enabled"
                    checked={formData.tire_hotel_enabled}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tire_hotel_enabled" className="ml-3 text-sm font-medium text-gray-700">
                    Lastik oteli hizmetini aktifleştir
                  </label>
                </div>

                {formData.tire_hotel_enabled && (
                  <Input
                    label="Depolama Kapasitesi (Takım Sayısı)"
                    name="tire_storage_capacity"
                    type="number"
                    value={formData.tire_storage_capacity}
                    onChange={handleInputChange}
                    leftIcon={<Warehouse className="h-4 w-4 text-gray-400" />}
                    placeholder="20"
                    min="1"
                  />
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-medium text-gray-900">Notlar</h2>
              </div>
              <div className="card-body">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ek Notlar
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Müşteri hakkında ek bilgiler..."
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                İptal
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                icon={<Save className="h-4 w-4" />}
              >
                {isLoading ? 'Kaydediliyor...' : 'Müşteri Kaydet'}
              </Button>
            </div>
          </form>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default NewCustomerPage;