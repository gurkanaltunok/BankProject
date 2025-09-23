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
  const [userDetails, setUserDetails] = useState<any>(null);
  const [addressDetails, setAddressDetails] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phoneNumber: '',
    tckn: '',
    birthDate: '',
    country: '',
    city: '',
    district: '',
    neighborhood: '',
    addressDetail: ''
  });
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadUserDetails();
      loadCities();
    }
  }, [user]);

  const loadCities = async () => {
    try {
      setLoadingCities(true);
      const citiesData = await apiService.getCities();
      setCities(citiesData);
    } catch (error) {
      console.error('Şehirler yüklenirken hata:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadDistricts = async (cityName: string) => {
    try {
      setLoadingDistricts(true);
      const city = cities.find(c => c.name === cityName);
      if (city) {
        const districtsData = await apiService.getDistricts(city.id);
        setDistricts(districtsData);
      }
    } catch (error) {
      console.error('İlçeler yüklenirken hata:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };


  const loadUserDetails = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const userData = await apiService.getCurrentUser();
      setUserDetails(userData);
      
      let addressData = null;
      try {
        addressData = await apiService.getAddressByUserId(user.id);
        setAddressDetails(addressData);
      } catch (addressError) {
        setAddressDetails(null);
      }
      
      setFormData({
        name: userData.name || '',
        surname: userData.surname || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        tckn: userData.tckn || '',
        birthDate: userData.birthDate ? new Date(userData.birthDate).toISOString().split('T')[0] : '',
        country: addressData?.country || '',
        city: addressData?.city || '',
        district: addressData?.district || '',
        neighborhood: addressData?.neighborhood || '',
        addressDetail: addressData?.addressDetail || ''
      });

      if (addressData?.city) {
        setSelectedCity(addressData.city);
        const city = cities.find(c => c.name === addressData.city);
        if (city) {
          loadDistricts(addressData.city);
        }
      }
      if (addressData?.district) {
        setSelectedDistrict(addressData.district);
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPhoneNumber = (value: string) => {
    let formatted = value.replace(/\D/g, ''); // Sadece rakamlar

    if (formatted.length > 11) {
      formatted = formatted.substring(0, 11);
    }

    if (formatted.length > 0 && !formatted.startsWith('0')) {
      formatted = '0' + formatted;
    }

    if (formatted.length >= 1) {
      if (formatted.length <= 1) {
        formatted = formatted;
      } else if (formatted.length <= 4) {
        formatted = formatted.replace(/^(\d{1})(\d{0,3})$/, '$1($2');
      } else if (formatted.length <= 7) {
        formatted = formatted.replace(/^(\d{1})(\d{3})(\d{0,3})$/, '$1($2)$3');
      } else if (formatted.length <= 9) {
        formatted = formatted.replace(/^(\d{1})(\d{3})(\d{3})(\d{0,2})$/, '$1($2)$3 $4');
      } else if (formatted.length <= 11) {
        formatted = formatted.replace(/^(\d{1})(\d{3})(\d{3})(\d{2})(\d{0,2})$/, '$1($2)$3 $4 $5');
      }
    }
    return formatted;
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      phoneNumber: formatted
    }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    setFormData(prev => ({ ...prev, city: cityName }));
    setSelectedDistrict('');
    setFormData(prev => ({ ...prev, district: '' }));
    setDistricts([]);
    
    if (cityName) {
      loadDistricts(cityName);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtName = e.target.value;
    setSelectedDistrict(districtName);
    setNeighborhoods([]);
    setFormData(prev => ({ ...prev, district: districtName, neighborhood: '' }));
    
    if (districtName) {
      loadNeighborhoods(districtName);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      await apiService.updateUser({
        name: userDetails?.name || '',
        surname: userDetails?.surname || '',
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        tckn: userDetails?.tckn || ''
      });
      
      if (addressDetails) {
        await apiService.updateAddress(addressDetails.addressId, {
          country: formData.country,
          city: formData.city,
          district: formData.district,
          neighborhood: formData.neighborhood,
          addressDetail: formData.addressDetail
        });
      } else {
        await apiService.createAddress({
          country: formData.country,
          city: formData.city,
          district: formData.district,
          neighborhood: formData.neighborhood,
          addressDetail: formData.addressDetail,
          userId: user?.id
        });
      }
      
      setEditing(false);
      await loadUserDetails();
    } catch (error) {
      console.error('Profil güncellenirken hata oluştu:', error);
      alert('Profil güncellenirken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (userDetails) {
      setFormData({
        name: userDetails.name || '',
        surname: userDetails.surname || '',
        email: userDetails.email || '',
        phoneNumber: userDetails.phoneNumber || '',
        tckn: userDetails.tckn || '',
        birthDate: userDetails.birthDate ? new Date(userDetails.birthDate).toISOString().split('T')[0] : '',
        country: addressDetails?.country || '',
        city: addressDetails?.city || '',
        district: addressDetails?.district || '',
        neighborhood: addressDetails?.neighborhood || '',
        addressDetail: addressDetails?.addressDetail || ''
      });
      setSelectedCity(addressDetails?.city || '');
      setSelectedDistrict(addressDetails?.district || '');
    }
    setEditing(false);
  };

  if (authLoading || loading) {
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
                <p className="text-gray-900 py-2">{userDetails?.name || 'Belirtilmemiş'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soyad
                </label>
                <p className="text-gray-900 py-2">{userDetails?.surname || 'Belirtilmemiş'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TC Kimlik No
                </label>
                <p className="text-gray-900 py-2">{userDetails?.tckn || 'Belirtilmemiş'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doğum Tarihi
                </label>
                <p className="text-gray-900 py-2">
                  {userDetails?.birthDate ? new Date(userDetails.birthDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                </p>
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
                  <p className="text-gray-900 py-2">{userDetails?.email || 'Belirtilmemiş'}</p>
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
                    onChange={handlePhoneInputChange}
                    onKeyDown={(e) => {
                      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                      if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onFocus={(e) => {
                      if (!e.target.value) {
                        setFormData(prev => ({ ...prev, phoneNumber: '0(5' }));
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = e.clipboardData.getData('text');
                      const formatted = formatPhoneNumber(pastedText);
                      if (formatted.length > 0) {
                        setFormData(prev => ({ ...prev, phoneNumber: formatted }));
                      }
                    }}
                    placeholder="0(555) 555 55 55"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userDetails?.phoneNumber || 'Belirtilmemiş'}</p>
                )}
              </div>

              {/* Address Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ülke
                </label>
                {editing ? (
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Ülke Seçiniz</option>
                    <option value="Türkiye">Türkiye</option>
                  </select>
                ) : (
                  <p className="text-gray-900 py-2">{addressDetails?.country || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İl
                </label>
                {editing ? (
                  <select
                    name="city"
                    value={selectedCity}
                    onChange={handleCityChange}
                    disabled={loadingCities}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">{loadingCities ? 'Yükleniyor...' : 'İl Seçiniz'}</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 py-2">{addressDetails?.city || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İlçe
                </label>
                {editing ? (
                  <select
                    name="district"
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    disabled={loadingDistricts || !selectedCity}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">{loadingDistricts ? 'Yükleniyor...' : 'İlçe Seçiniz'}</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.name}>{district.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 py-2">{addressDetails?.district || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mahalle
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    placeholder="Mahalle adını giriniz"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{addressDetails?.neighborhood || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres Detayı
                </label>
                {editing ? (
                  <textarea
                    name="addressDetail"
                    value={formData.addressDetail}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Cadde, sokak, bina no, daire no vb."
                  />
                ) : (
                  <p className="text-gray-900 py-2">{addressDetails?.addressDetail || 'Belirtilmemiş'}</p>
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
                <p className="font-semibold">{userDetails?.id || user?.id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rol</p>
                <p className="font-semibold">
                  {userDetails?.roleId === 1 ? 'Müşteri' : userDetails?.roleId === 2 ? 'Admin' : user?.roleId === 1 ? 'Müşteri' : user?.roleId === 2 ? 'Admin' : 'Bilinmeyen'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kayıt Tarihi</p>
                <p className="font-semibold">
                  {userDetails?.dateCreated ? new Date(userDetails.dateCreated).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
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
