'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import HeaderBox from '@/components/HeaderBox';
import { apiService } from '@/lib/api';

const ChangePassword = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Mevcut şifre gereklidir';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Yeni şifre gereklidir';
    } else if (!/^\d{6}$/.test(formData.newPassword)) {
      newErrors.newPassword = 'Şifre 6 haneli olmalı ve sadece rakamlardan oluşmalı';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifre onayı gereklidir';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // First verify current password by attempting login
      try {
        await apiService.login({
          TCKN: user?.tckn || '',
          Password: formData.currentPassword
        });
      } catch (loginError) {
        setErrors({ currentPassword: 'Mevcut şifre yanlış' });
        return;
      }

      // If login successful, update password
      await apiService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      alert('Şifre başarıyla değiştirildi');
      router.push('/profile');
    } catch (error) {
      console.error('Şifre değiştirilirken hata oluştu:', error);
      alert('Şifre değiştirilirken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/sign-in');
    return null;
  }

  return (
    <section className="home min-h-screen">
      <div className="home-content min-h-screen">
        <header className="home-header text-center">
          <HeaderBox 
            type="greeting"
            title="Şifre Değiştir"
            user=""
            subtext="Hesap güvenliğiniz için şifrenizi güncelleyin"
          />
        </header>

        <div className="mt-8 flex justify-center">
          <div className="bg-white p-6 rounded-lg shadow-sm border max-w-md w-full">

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mevcut Şifre
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white ${
                    errors.currentPassword ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Mevcut şifrenizi girin"
                />
                {errors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  maxLength={6}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white ${
                    errors.newPassword ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="6 haneli yeni şifre"
                />
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">Şifre 6 haneli olmalı ve sadece rakamlardan oluşmalı</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  maxLength={6}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Yeni şifreyi tekrar girin"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>


              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Değiştiriliyor...
                    </div>
                  ) : (
                    'Şifre Değiştir'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChangePassword;
