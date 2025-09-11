'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { useExchangeRates } from '@/lib/hooks/useExchangeRates';
import ExchangeRatesWidget from '@/components/ExchangeRatesWidget';
import { getAccountTypeLabel, getCurrencyTypeLabel, getCurrencySymbol } from '@/types/enums';

const Home = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { convertToTRY, rates } = useExchangeRates();
  const router = useRouter();
  const [displayBalance, setDisplayBalance] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (accounts.length === 0 || rates.length === 0) return;

    // Tüm hesapları TRY'ye çevir
    const totalBalanceTRY = accounts.reduce((sum, account) => {
      const balance = account.balance || account.currentBalance || 0;
      const currencyType = account.currencyType || 0;
      
      // Manuel döviz kuru hesaplaması (convertToTRY fonksiyonunu kullanmadan)
      let convertedBalance = balance;
      if (currencyType === 1) { // USD
        const usdRate = rates.find(r => r.currency === 'USD')?.rate || 34.50;
        convertedBalance = balance * usdRate;
      } else if (currencyType === 2) { // EUR
        const eurRate = rates.find(r => r.currency === 'EUR')?.rate || 37.20;
        convertedBalance = balance * eurRate;
      }
      // currencyType === 0 ise TRY, değişiklik yok
      
      return sum + convertedBalance;
    }, 0);

    // Seçilen para birimine çevir
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
                <p className="text-sm text-gray-500">Toplam Bakiye</p>
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
                {displayBalance.toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
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