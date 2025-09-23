'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import Link from 'next/link';
import { apiService } from '@/lib/api';

interface AuthFormProps {
  type: 'sign-in' | 'sign-up';
}


const AuthForm = ({ type }: AuthFormProps) => {
  const router = useRouter();
  const { login, register, loading } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    Name: '',
    Surname: '',
    TCKN: '',
    Email: '',
    Password: '',
    ConfirmPassword: '',
    PhoneNumber: '',
    BirthDate: '',
    Country: 'Türkiye',
    City: '',
    District: '',
    Neighborhood: '',
    AddressDetail: '',
    RoleId: 1,
  });

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    if (type === 'sign-up') {
      loadCities();
    }
  }, [type]);

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

  const loadDistricts = async (cityId: number) => {
    try {
      setLoadingDistricts(true);
      const districtsData = await apiService.getDistricts(cityId);
      setDistricts(districtsData);
    } catch (error) {
      console.error('İlçeler yüklenirken hata:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };


  const formatPhoneNumber = (value: string) => {
    let formatted = value.replace(/\D/g, '');
    
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'PhoneNumber') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }

    if (name === 'Password' || name === 'ConfirmPassword') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 6) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    if (name === 'TCKN') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 11) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    const selectedCityData = cities.find(city => city.name === cityName);
    
    setSelectedCity(cityName);
    setSelectedDistrict('');
    setDistricts([]);
    
    setFormData(prev => ({ 
      ...prev, 
      City: cityName, 
      District: '',
      Neighborhood: '',
      AddressDetail: ''
    }));

    if (selectedCityData) {
      loadDistricts(selectedCityData.id);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtName = e.target.value;
    const selectedDistrictData = districts.find(district => district.name === districtName);
    
    setSelectedDistrict(districtName);
    
    setFormData(prev => ({ 
      ...prev, 
      District: districtName,
      Neighborhood: '',
      AddressDetail: ''
    }));

  };


  const validateForm = () => {
    // Sign-in validasyonu
    if (type === 'sign-in') {
      // TCKN kontrolü
      if (!formData.TCKN || formData.TCKN.length !== 11) {
        setError('TC Kimlik No 11 haneli olmalıdır');
        return false;
      }

      // Şifre kontrolü
      if (!formData.Password || formData.Password.length !== 6) {
        setError('Şifre 6 haneli olmalıdır');
        return false;
      }

      if (!/^\d{6}$/.test(formData.Password)) {
        setError('Şifre sadece rakamlardan oluşmalıdır');
        return false;
      }
    }

    if (type === 'sign-up') {
      // Şifre kontrolü
      if (formData.Password.length !== 6) {
        setError('Şifre 6 haneli olmalıdır');
        return false;
      }

      if (!/^\d{6}$/.test(formData.Password)) {
        setError('Şifre sadece rakamlardan oluşmalıdır');
        return false;
      }

      if (formData.Password !== formData.ConfirmPassword) {
        setError('Şifreler uyuşmuyor');
        return false;
      }

      // TCKN kontrolü
      if (formData.TCKN.length !== 11) {
        setError('TC Kimlik No 11 haneli olmalıdır');
        return false;
      }

      // Telefon kontrolü
      const phoneDigits = formData.PhoneNumber.replace(/\D/g, '');
      if (phoneDigits.length !== 11) {
        setError('Telefon numarası 11 haneli olmalıdır');
        return false;
      }

      // Doğum tarihi kontrolü
      if (!formData.BirthDate) {
        setError('Doğum tarihi gereklidir');
        return false;
      }

      // Adres kontrolü
      if (!formData.City || !formData.District || !formData.Neighborhood || !formData.AddressDetail) {
        setError('Tüm adres bilgileri gereklidir');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      if (type === 'sign-in') {
        await login(formData.TCKN, formData.Password);
        router.push('/');
      } else {
        const phoneDigits = formData.PhoneNumber.replace(/\D/g, '');
        const cleanPhone = phoneDigits.substring(1); // 0 ı çıkar

        const fullAddress = `${formData.AddressDetail}, ${formData.Neighborhood}, ${formData.District}, ${formData.City}, ${formData.Country}`;

        const { ConfirmPassword, ...formDataWithoutConfirm } = formData;
        const registerData = {
          ...formDataWithoutConfirm,
          PhoneNumber: cleanPhone,
          Address: fullAddress,
          BirthDate: new Date(formData.BirthDate),
          Password: formData.Password,
        };

        await register(registerData);
        setSuccess('Hesap başarıyla oluşturuldu. Lütfen giriş yapın.');
        setTimeout(() => {
          router.push('/sign-in');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Modern Card Design */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
              <img 
                src="/icons/logo.svg"
                width={28}
                height={28}
                alt="Agartha logo"
                className="filter brightness-0 invert"
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Agartha Bank
            </h1>
          </Link>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {type === 'sign-in' ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
            </h2>
            <p className="text-gray-600">
              {type === 'sign-in' 
                ? 'Güvenli bankacılık deneyimine giriş yapın'
                : 'Modern bankacılık hizmetlerine katılın'
              }
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {type === 'sign-up' && (
            <>
              {/* Kişisel Bilgiler */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Kişisel Bilgiler</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Ad *</label>
                    <input
                      type="text"
                      name="Name"
                      value={formData.Name}
                      onChange={handleInputChange}
                      placeholder="Adınız"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Soyad *</label>
                    <input
                      type="text"
                      name="Surname"
                      value={formData.Surname}
                      onChange={handleInputChange}
                      placeholder="Soyadınız"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">TC Kimlik No *</label>
                  <input
                    type="text"
                    name="TCKN"
                    value={formData.TCKN}
                    onChange={handleInputChange}
                    placeholder="12345678901"
                    maxLength={11}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Doğum Tarihi *</label>
                  <input
                    type="date"
                    name="BirthDate"
                    value={formData.BirthDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">E-posta *</label>
                  <input
                    type="email"
                    name="Email"
                    value={formData.Email}
                    onChange={handleInputChange}
                    placeholder="ornek@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Telefon *</label>
                  <input
                    type="tel"
                    name="PhoneNumber"
                    value={formData.PhoneNumber}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                      if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onFocus={(e) => {
                      if (!e.target.value) {
                        setFormData(prev => ({ ...prev, PhoneNumber: '0(5' }));
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = e.clipboardData.getData('text');
                      const formatted = formatPhoneNumber(pastedText);
                      if (formatted.length > 0) {
                        setFormData(prev => ({ ...prev, PhoneNumber: formatted }));
                      }
                    }}
                    placeholder="0(555) 555 55 55"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              {/* Şifre Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Şifre Bilgileri</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Şifre (6 haneli) *</label>
                    <input
                      type="password"
                      name="Password"
                      value={formData.Password}
                      onChange={handleInputChange}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Şifre Tekrar *</label>
                    <input
                      type="password"
                      name="ConfirmPassword"
                      value={formData.ConfirmPassword}
                      onChange={handleInputChange}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Adres Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Adres Bilgileri</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Ülke *</label>
                    <select
                      name="Country"
                      value={formData.Country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      required
                    >
                      <option value="Türkiye">Türkiye</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">İl *</label>
                    <select
                      name="City"
                      value={selectedCity}
                      onChange={handleCityChange}
                      disabled={loadingCities}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm disabled:bg-gray-100"
                      required
                    >
                      <option value="">{loadingCities ? 'Yükleniyor...' : 'İl Seçiniz'}</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">İlçe *</label>
                    <select
                      name="District"
                      value={selectedDistrict}
                      onChange={handleDistrictChange}
                      disabled={!selectedCity || loadingDistricts}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm disabled:bg-gray-100"
                      required
                    >
                      <option value="">{loadingDistricts ? 'Yükleniyor...' : 'İlçe Seçiniz'}</option>
                      {districts.map(district => (
                        <option key={district.id} value={district.name}>{district.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Mahalle *</label>
                    <input
                      type="text"
                      name="Neighborhood"
                      value={formData.Neighborhood}
                      onChange={handleInputChange}
                      placeholder="Mahalle adını giriniz"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Adres Detayı *</label>
                  <textarea
                    name="AddressDetail"
                    value={formData.AddressDetail}
                    onChange={(e) => setFormData(prev => ({ ...prev, AddressDetail: e.target.value }))}
                    placeholder="Cadde, sokak, bina no, daire no vb."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {type === 'sign-in' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">TC Kimlik No</label>
                <input
                  type="text"
                  name="TCKN"
                  value={formData.TCKN}
                  onChange={handleInputChange}
                  placeholder="12345678901"
                  maxLength={11}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Şifre</label>
                <input
                  type="password"
                  name="Password"
                  value={formData.Password}
                  onChange={handleInputChange}
                  placeholder="6 haneli şifreniz"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  required
                />
              </div>
            </>
          )}

          {/* Error & Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {type === 'sign-in' ? 'Giriş yapılıyor...' : 'Hesap oluşturuluyor...'}
              </div>
            ) : (
              type === 'sign-in' ? 'Giriş Yap' : 'Hesap Oluştur'
            )}
          </Button>

          {/* Switch Form Type */}
          <div className="text-center">
            <p className="text-gray-600">
              {type === 'sign-in' ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
              <Link 
                href={type === 'sign-in' ? '/sign-up' : '/sign-in'}
                className="ml-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
              >
                {type === 'sign-in' ? 'Hesap oluşturun' : 'Giriş yapın'}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;