'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiService } from '@/lib/api';
import { getAccountTypeLabel, getCurrencyTypeLabel, getCurrencySymbol } from '@/types/enums';
import HeaderBox from '@/components/HeaderBox';

const UserDetails = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    } else if (user?.roleId !== 2) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, user, router]);

  useEffect(() => {
    if (user?.roleId === 2 && userId) {
      loadAdminDashboardData();
    }
  }, [user, userId]);

  const loadAdminDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getAdminDashboard();
      setDashboardData(data);
    } catch (error: any) {
      console.error('Admin dashboard data yüklenirken hata:', error);
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRoleId: number) => {
    try {
      await apiService.updateUserRole(userId, newRoleId);
      await loadAdminDashboardData(); // Refresh data
    } catch (error) {
      console.error('Rol güncellenirken hata:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.roleId !== 2) {
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button 
            onClick={loadAdminDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const selectedUser = dashboardData?.users?.find((u: any) => u.id === Number(userId));
  const userAccounts = dashboardData?.accounts?.filter((account: any) => account.userId === Number(userId)) || [];

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Kullanıcı bulunamadı</div>
          <button 
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Kullanıcı Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header>
        <HeaderBox 
          title={`${selectedUser.name} ${selectedUser.surname}`}
          subtext="Kullanıcı detayları ve hesap bilgileri"
        />
      </header>

      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={() => router.push('/admin/users')}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kullanıcı Listesine Dön
        </button>
      </div>

      {/* User Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Kişisel Bilgiler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
            <p className="text-lg font-semibold text-gray-900">{selectedUser.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
            <p className="text-lg font-semibold text-gray-900">{selectedUser.surname}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-lg text-gray-900">{selectedUser.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TCKN</label>
            <p className="text-lg text-gray-900">{selectedUser.tckn}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <p className="text-lg text-gray-900">{selectedUser.phoneNumber || 'Belirtilmemiş'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doğum Tarihi</label>
            <p className="text-lg text-gray-900">
              {selectedUser.birthDate ? new Date(selectedUser.birthDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
            {selectedUser.address ? (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-900">
                  {selectedUser.address.addressDetail}, {selectedUser.address.neighborhood}, 
                  {selectedUser.address.district}, {selectedUser.address.city}, {selectedUser.address.country}
                </p>
              </div>
            ) : (
              <p className="text-lg text-gray-500">Adres bilgisi bulunmuyor</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Rol</label>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                selectedUser.roleId === 2 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {selectedUser.roleName}
              </span>
              {selectedUser.id !== 1 && (
                <button
                  onClick={() => handleRoleChange(selectedUser.id, selectedUser.roleId === 1 ? 2 : 1)}
                  className={`px-3 py-1 text-sm rounded-full font-medium ${
                    selectedUser.roleId === 1 
                      ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {selectedUser.roleId === 1 ? 'Admin Yap' : 'Müşteri Yap'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Accounts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Hesaplar ({userAccounts.length})</h2>
        
        {userAccounts.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-600">Bu kullanıcının henüz hesabı yok</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {userAccounts.map((account: any) => (
              <div key={account.accountId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getAccountTypeLabel(account.accountType)} Hesap
                    </h3>
                    <p className="text-sm text-gray-600">{account.iban}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {account.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Para Birimi:</span>
                    <span className="text-sm font-medium">{getCurrencyTypeLabel(account.currencyType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bakiye:</span>
                    <span className="text-sm font-semibold">
                      {getCurrencySymbol(account.currencyType)}
                      {account.balance.toLocaleString('tr-TR', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Açılış Tarihi:</span>
                    <span className="text-sm font-medium">
                      {account.dateCreated ? new Date(account.dateCreated).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => router.push(`/admin/account/${account.accountId}`)}
                    className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Hesap Detaylarını Görüntüle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Summary */}
      {userAccounts.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">Hesap Özeti</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Toplam Hesap: </span>
              <span className="font-semibold">{userAccounts.length}</span>
            </div>
            <div>
              <span className="text-blue-700">Aktif Hesap: </span>
              <span className="font-semibold text-green-800">
                {userAccounts.filter((acc: any) => acc.isActive).length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Pasif Hesap: </span>
              <span className="font-semibold text-red-800">
                {userAccounts.filter((acc: any) => !acc.isActive).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
