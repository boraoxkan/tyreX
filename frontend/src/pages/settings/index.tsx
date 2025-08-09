import React, { useState } from 'react';
import Head from 'next/head';
import { User, Building, Bell, CreditCard, Shield, Save } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/store/authStore';

const SettingsPage: React.FC = () => {
  const { user, company } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'company', name: 'Şirket', icon: Building },
    { id: 'notifications', name: 'Bildirimler', icon: Bell },
    { id: 'billing', name: 'Faturalama', icon: CreditCard },
    { id: 'security', name: 'Güvenlik', icon: Shield },
  ];

  const TabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Kişisel Bilgiler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Ad</label>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue={user?.first_name}
                  />
                </div>
                <div>
                  <label className="form-label">Soyad</label>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue={user?.last_name}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">E-posta</label>
                  <input
                    type="email"
                    className="form-input"
                    defaultValue={user?.email}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Şifre Değiştir
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Mevcut Şifre</label>
                  <input type="password" className="form-input" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Yeni Şifre</label>
                    <input type="password" className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Yeni Şifre Tekrar</label>
                    <input type="password" className="form-input" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="btn btn-primary">
                <Save className="h-5 w-5 mr-2" />
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Şirket Bilgileri
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Şirket Adı</label>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue={company?.name}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">E-posta</label>
                    <input
                      type="email"
                      className="form-input"
                      defaultValue={company?.email}
                    />
                  </div>
                  <div>
                    <label className="form-label">Telefon</label>
                    <input
                      type="tel"
                      className="form-input"
                      defaultValue={company?.phone}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Adres</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    defaultValue={company?.address}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Toptancı İlişkileri
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Toptancı ilişkilerinizi yönetmek için destek ekibimizle iletişime geçin.
                </p>
                <button className="btn btn-outline">
                  Destek İle İletişim
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="btn btn-primary">
                <Save className="h-5 w-5 mr-2" />
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Bildirim Tercihleri
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Sipariş Bildirimleri</p>
                    <p className="text-sm text-gray-500">Sipariş durumu güncellemeleri</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Fiyat Uyarıları</p>
                    <p className="text-sm text-gray-500">Özel fiyat indirimleri ve kampanyalar</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Stok Bildirimleri</p>
                    <p className="text-sm text-gray-500">Takip ettiğiniz ürünlerin stok durumu</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Haftalık Raporlar</p>
                    <p className="text-sm text-gray-500">Haftalık satış ve performans raporları</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" defaultChecked />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="btn btn-primary">
                <Save className="h-5 w-5 mr-2" />
                Tercihleri Kaydet
              </button>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Abonelik Bilgileri
              </h3>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-primary-800">Temel Plan</h4>
                    <p className="text-sm text-primary-600">7 günlük ücretsiz deneme aktif</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-800">₺299</p>
                    <p className="text-sm text-primary-600">/ay</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-primary-200">
                  <button className="btn btn-primary">
                    Planı Yükselt
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Fatura Geçmişi
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    Henüz fatura geçmişiniz bulunmamaktadır. 
                    Ücretsiz deneme süreniz sonrasında faturalarınız burada görünecektir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Güvenlik Ayarları
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">İki Faktörlü Doğrulama</p>
                    <p className="text-sm text-gray-500">Hesabınız için ekstra güvenlik katmanı</p>
                  </div>
                  <button className="btn btn-outline btn-sm">
                    Etkinleştir
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Giriş Bildirimleri</p>
                    <p className="text-sm text-gray-500">Yeni giriş yapıldığında e-posta gönder</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Oturum Süresi</p>
                    <p className="text-sm text-gray-500">Otomatik çıkış süresi</p>
                  </div>
                  <select className="form-input w-auto">
                    <option>1 saat</option>
                    <option>8 saat</option>
                    <option>1 gün</option>
                    <option>1 hafta</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Aktif Oturumlar
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Chrome • İstanbul, TR</p>
                      <p className="text-sm text-gray-500">Mevcut oturum • 185.XXX.XXX.XXX</p>
                    </div>
                    <span className="badge badge-success">Aktif</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="btn btn-primary">
                <Save className="h-5 w-5 mr-2" />
                Ayarları Kaydet
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthGuard>
      <Head>
        <title>Ayarlar - tyreX</title>
        <meta name="description" content="Hesap ayarlarınızı yönetin" />
      </Head>

      <Layout title="Ayarlar">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="card">
                <div className="card-body">
                  <TabContent />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default SettingsPage;