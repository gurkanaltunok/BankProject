'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { useExchangeRates } from '@/lib/hooks/useExchangeRates';
import ExchangeRatesWidget from '@/components/ExchangeRatesWidget';
import AdminCharts from '@/components/AdminCharts';
import { getAccountTypeLabel, getCurrencyTypeLabel, getCurrencySymbol } from '@/types/enums';
import { apiService } from '@/lib/api';

const Home = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { convertToTRY, rates } = useExchangeRates();
  const router = useRouter();
  const [displayBalance, setDisplayBalance] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [totalBalanceInTRY, setTotalBalanceInTRY] = useState(0);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dailyTransactionVolume, setDailyTransactionVolume] = useState<any[]>([]);
  const [dailyCommissionRevenue, setDailyCommissionRevenue] = useState<any[]>([]);

  useEffect(() => {
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user?.roleId === 2) {
      loadAdminDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (user?.roleId === 1 && isAuthenticated) {
      loadTotalBalance();
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (user?.roleId === 1 && isAuthenticated && rates.length > 0) {
      loadTotalBalance();
    }
  }, [rates, user, isAuthenticated]);

  const loadTotalBalance = async () => {
    try {
      setIsUpdatingBalance(true);
      const totalBalance = await apiService.getMyTotalBalance();
      setTotalBalanceInTRY(totalBalance);
    } catch (error) {
      console.error('Error loading total balance:', error);
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  const loadAdminDashboardData = async () => {
    try {
      const data = await apiService.getAdminDashboard();
      setDashboardData(data);
      
      try {
        const volumeData = await apiService.getDailyTransactionVolume();
        setDailyTransactionVolume(volumeData);
      } catch (volumeError) {
        console.error('Volume data yüklenirken hata:', volumeError);
        setDailyTransactionVolume([]);
      }

      try {
        const commissionData = await apiService.getDailyCommissionRevenue();
        setDailyCommissionRevenue(commissionData);
      } catch (commissionError) {
        console.error('Commission data yüklenirken hata:', commissionError);
        setDailyCommissionRevenue([]);
      }
    } catch (error) {
      console.error('Admin dashboard data yüklenirken hata:', error);
      setDashboardData({ 
        bankBalance: 0, 
        totalUsers: 0, 
        totalBalance: 0, 
        totalAccounts: 0, 
        users: [], 
        accounts: [] 
      });
      setDailyTransactionVolume([]);
    }
  };


  useEffect(() => {
    if (accounts.length === 0 || rates.length === 0) return;

    const totalBalanceTRY = accounts.reduce((sum, account) => {
      const balance = account.balance || account.currentBalance || 0;
      const currencyType = account.currencyType || 0;
      
      let convertedBalance = balance;
      if (currencyType === 1) { // USD
        const usdRate = rates.find(r => r.currency === 'USD')?.rate || 34.50;
        convertedBalance = balance * usdRate;
      } else if (currencyType === 2) { // EUR
        const eurRate = rates.find(r => r.currency === 'EUR')?.rate || 37.20;
        convertedBalance = balance * eurRate;
      }
      
      return sum + convertedBalance;
    }, 0);

    let finalBalance = totalBalanceTRY;
    if (displayCurrency === 'USD') {
      const usdRate = rates.find(r => r.currency === 'USD')?.rate || 34.50;
      finalBalance = totalBalanceTRY / usdRate;
    } else if (displayCurrency === 'EUR') {
      const eurRate = rates.find(r => r.currency === 'EUR')?.rate || 37.20;
      finalBalance = totalBalanceTRY / eurRate;
    }
    
    if (finalBalance > 0) {
      const duration = 2000;
      const steps = 60;
      const increment = finalBalance / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= finalBalance) {
          setDisplayBalance(finalBalance);
          clearInterval(timer);
        } else {
          setDisplayBalance(Math.floor(current * 100) / 100);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [accounts, rates, displayCurrency]);

  if (authLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.roleId === 2) {
    if (!dashboardData) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">Admin verileri yükleniyor...</div>
          </div>
        </div>
      );
    }

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <div className="text-sm text-gray-500">
            Hoş geldiniz, {user?.name} {user?.surname}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Bank Balance */}
          <div 
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
            onClick={() => router.push('/account/1')}
            title="Banka hesabı detaylarını görüntüle"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Banka Kasası</p>
                <p className="text-2xl font-bold">₺{dashboardData.bankBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-blue-200 text-xs mt-1">Detayları görüntüle →</p>
              </div>
              <div className="text-blue-200">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            onClick={() => router.push('/admin/users')}
            title="Kullanıcı yönetimi sayfasına git"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold">{dashboardData.totalUsers}</p>
                <p className="text-blue-200 text-xs mt-1">Kullanıcı yönetimi →</p>
              </div>
              <div className="text-blue-200">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Balance */}
          <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Toplam Bakiye</p>
                <p className="text-2xl font-bold">₺{dashboardData.totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="text-blue-200">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Accounts */}
          <div className="bg-gradient-to-r from-blue-300 to-blue-400 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Toplam Hesap</p>
                <p className="text-2xl font-bold">{dashboardData.totalAccounts}</p>
              </div>
              <div className="text-blue-200">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <AdminCharts 
            bankBalance={dashboardData.bankBalance}
            totalBalance={dashboardData.totalBalance}
            totalUsers={dashboardData.totalUsers}
            totalAccounts={dashboardData.totalAccounts}
            accounts={dashboardData.accounts}
            dailyTransactionVolume={dailyTransactionVolume}
            dailyCommissionRevenue={dailyCommissionRevenue}
          />
        </div>

      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
                    <div>
              <h1 className="text-2xl font-bold">
                Hoşgeldin, <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{user?.name || 'Kullanıcı'}</span>
              </h1>
              <p className="text-gray-600 mt-1">
                Banka hesaplarını ve işlemlerini yönet
                      </p>
                    </div>
                    <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Toplam Bakiye</p>
                  <div className="relative group">
                    <svg className="w-3 h-3 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      Güncel döviz kurları ile hesaplanır. Her 30 saniyede otomatik güncellenir.
                    </div>
                  </div>
                </div>
                {isUpdatingBalance && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                )}
                <div className="relative">
                  <button
                    onClick={() => {
                      const currencies: ('TRY' | 'USD' | 'EUR')[] = ['TRY', 'USD', 'EUR'];
                      const currentIndex = currencies.indexOf(displayCurrency);
                      const nextIndex = (currentIndex + 1) % currencies.length;
                      setDisplayCurrency(currencies[nextIndex]);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    title="Para birimini değiştir"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {displayCurrency === 'TRY' ? '₺' : displayCurrency === 'USD' ? '$' : '€'}
                {displayCurrency === 'TRY' 
                  ? totalBalanceInTRY.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })
                  : displayBalance.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })
                }
                      </p>
                    </div>
                  </div>
                </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Hesaplarım</h2>
                <p className="text-gray-600 mt-1">Tüm banka hesaplarınızı görüntüleyin ve yönetin</p>
              </div>

              {accounts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz hesabınız yok</h3>
                  <p className="text-gray-600 mb-6">Yeni hesap açmak için My Banks sayfasını ziyaret edin.</p>
                  <button 
                    onClick={() => router.push('/my-banks')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Yeni Hesap Aç
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {accounts.map((account, index) => {
                      const balance = account.balance || 0;
                      const typeLabel = getAccountTypeLabel(account.accountType || 0);
                      const currencyLabel = getCurrencyTypeLabel(account.currencyType || 0);
                      const currencySymbol = getCurrencySymbol(account.currencyType || 0);
                      const iban = account.iban || `Hesap ${index + 1}`;

                      return (
                        <div 
                          key={account.id || index}
                          className="account-card p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
                          onClick={() => router.push(`/account/${account.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="account-title font-semibold text-gray-900 transition-colors mb-2">
                                {typeLabel} Hesap
                              </h3>
                              <p className="text-sm text-gray-600 transition-colors mb-1">
                                {iban}
                              </p>
                              <p className="text-sm text-gray-600 transition-colors">
                                {currencyLabel}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="account-balance font-bold text-lg text-gray-900 transition-colors">
                                {currencySymbol}{balance.toLocaleString('tr-TR', { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </p>
                              <div className="account-detail-hint mt-2">
                                <span className="text-xs text-blue-600 font-medium">Detayları Gör →</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <ExchangeRatesWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;