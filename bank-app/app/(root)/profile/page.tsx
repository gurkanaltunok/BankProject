'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import HeaderBox from '@/components/HeaderBox';
import { apiService } from '@/lib/api';

const Profile = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phoneNumber: '',
    address: '',
    tckn: ''
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        surname: user.surname || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        tckn: user.tckn || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await apiService.updateUser({
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        tckn: formData.tckn
      });
      setEditing(false);
      // Optionally refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Profil güncellenirken hata oluştu:', error);
      alert('Profil güncellenirken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        surname: user.surname || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        tckn: user.tckn || ''
      });
    }
    setEditing(false);
  };

  if (authLoading) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox 
            type="greeting"
            title="Profil Bilgilerim"
            user={user?.name || 'Kullanıcı'}
            subtext="Kişisel bilgilerinizi görüntüleyin ve düzenleyin"
          />
        </header>

        <div className="mt-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-20 font-semibold text-gray-900">Kişisel Bilgiler</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Düzenle
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user?.name || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soyad
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user?.surname || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user?.email || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası
                </label>
                {editing ? (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user?.phoneNumber || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TC Kimlik No
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="tckn"
                    value={formData.tckn}
                    onChange={handleInputChange}
                    maxLength={11}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user?.tckn || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres
                </label>
                {editing ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user?.address || 'Belirtilmemiş'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-20 font-semibold text-gray-900 mb-4">Hesap Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Kullanıcı ID</p>
                <p className="font-semibold">{user?.id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rol</p>
                <p className="font-semibold">
                  {user?.roleId === 1 ? 'Müşteri' : user?.roleId === 2 ? 'Admin' : 'Bilinmeyen'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kayıt Tarihi</p>
                <p className="font-semibold">
                  {user?.dateCreated ? new Date(user.dateCreated).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hesap Durumu</p>
                <p className="font-semibold">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Aktif
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-20 font-semibold text-gray-900 mb-4">Güvenlik</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Şifre Değiştir</p>
                  <p className="text-sm text-gray-600">Hesap güvenliğiniz için şifrenizi düzenli olarak güncelleyin</p>
                </div>
                <button
                  onClick={() => router.push('/change-password')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Şifre Değiştir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
