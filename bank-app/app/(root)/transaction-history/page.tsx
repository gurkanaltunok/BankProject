'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import HeaderBox from '@/components/HeaderBox';
import { ArrowLeft } from 'lucide-react';

const TransactionHistory = () => {
  const { isAuthenticated, user } = useAuth();
  const { accounts, getCurrencySymbol } = useAccounts();
  const { transactions, loading, getTransactionsByDateRange, getTransactionsByAccount } = useTransactions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get('accountId');

  const handleGoBack = () => {
    router.back();
  };

  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // Default olarak 'all' seçili
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (accountIdParam) {
      setSelectedAccountId(parseInt(accountIdParam));
    }
  }, [accountIdParam]);

  useEffect(() => {
    // Default olarak tüm tarihleri kapsayacak şekilde ayarla
    setStartDate('');
    setEndDate('');
  }, []);

  useEffect(() => {
    // Default olarak tüm hesapları göster (undefined = tüm hesaplar)
    if (accounts.length > 0 && !accountIdParam) {
      setSelectedAccountId(undefined);
    }
  }, [accounts, accountIdParam]);

  const loadTransactions = async (accountId?: number, useDateFilter: boolean = false) => {
    try {
      setError('');
      const finalAccountId = accountId !== undefined ? accountId : selectedAccountId;
      
      let result;
      if (finalAccountId !== undefined && finalAccountId !== null) {
        // Belirli bir hesap seçiliyse, o hesabın işlemlerini al
        result = await getTransactionsByAccount(finalAccountId);
      } else {
        // Tüm hesaplar seçiliyse, tüm işlemleri al (tarih filtresi olmadan)
        result = await getTransactionsByDateRange();
      }
    } catch (err: any) {
      console.error('loadTransactions error:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (accounts.length > 0) {
      loadTransactions();
    }
  }, [accounts.length, selectedAccountId]);

  // Client-side filtering effect - çalışan sayfadaki gibi
  useEffect(() => {
    if (transactions.length > 0) {
      let filtered = transactions.filter(t => {
        // Hesap filtresi
        const isAccountMatch = selectedAccountId === undefined || 
          t.accountId === selectedAccountId || 
          t.targetAccountId === selectedAccountId;
        
        // Admin ise tüm işlemler, kullanıcı ise fee (4) ve exchange commission (7) gizli
        const isVisibleToUser = user?.roleId === 2 ? true : (t.transactionType !== 4 && t.transactionType !== 7);
        return isAccountMatch && isVisibleToUser;
      });

      // Tarih filtresi
      if (startDate && endDate) {
        // GMT+3 (Türkiye saati) için tarih karşılaştırması
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.transactionDate);
          // GMT+3 timezone'a çevir
          const transactionDateGMT3 = new Date(transactionDate.getTime() + (3 * 60 * 60 * 1000));
          const transactionDateStr = transactionDateGMT3.toISOString().split('T')[0]; // YYYY-MM-DD formatına çevir
          return transactionDateStr >= startDate && transactionDateStr <= endDate;
        });
      }

      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions([]);
    }
  }, [transactions, selectedAccountId, startDate, endDate, user]);


  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side filtering kullanıyoruz, sadece verileri yeniden yükle
    await loadTransactions(selectedAccountId, false);
  };

  const handleQuickFilter = async (filter: string) => {
    setQuickFilter(filter);
    // GMT+3 (Türkiye saati) için bugünü hesapla
    const now = new Date();
    const todayGMT3 = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    let start = new Date();
    let end = new Date();

    switch (filter) {
      case 'today':
        // Bugün için GMT+3'te bugünün tarihini kullan
        const todayStr = todayGMT3.toISOString().split('T')[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
        return;
      case '7days':
        start = new Date(todayGMT3);
        start.setDate(todayGMT3.getDate() - 7);
        end = new Date(todayGMT3);
        break;
      case '1month':
        start = new Date(todayGMT3);
        start.setMonth(todayGMT3.getMonth() - 1);
        end = new Date(todayGMT3);
        break;
      case '3months':
        start = new Date(todayGMT3);
        start.setMonth(todayGMT3.getMonth() - 3);
        end = new Date(todayGMT3);
        break;
      case '6months':
        start = new Date(todayGMT3);
        start.setMonth(todayGMT3.getMonth() - 6);
        end = new Date(todayGMT3);
        break;
      case '1year':
        start = new Date(todayGMT3);
        start.setFullYear(todayGMT3.getFullYear() - 1);
        end = new Date(todayGMT3);
        break;
      case 'all':
        // Tümü seçildiğinde tarih filtrelerini temizle
        setStartDate('');
        setEndDate('');
        return; // Erken çık
    }

    const newStartDate = start.toISOString().split('T')[0];
    const newEndDate = end.toISOString().split('T')[0];
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // Client-side filtering kullanıyoruz, sadece tarihleri güncelle
  };


  const getTransactionInfo = (transaction: any, currentAccountId: number) => {
    const isFee = transaction.transactionType === 4 || transaction.description?.includes('İşlem Ücreti') || false;
    const isExchangeCommission = transaction.transactionType === 7;
    
    if (isFee) {
      return {
        type: 'İşlem Ücreti',
        color: 'text-orange-600',
        sign: '+'
      };
    }
    
    if (isExchangeCommission) {
      return {
        type: 'Döviz Komisyonu',
        color: 'text-purple-600',
        sign: '+'
      };
    }
    
    const isDeposit = transaction.transactionType === 1;
    const isWithdraw = transaction.transactionType === 2;
    const isTransfer = transaction.transactionType === 3;
    const isExchangeBuy = transaction.transactionType === 5;
    const isExchangeSell = transaction.transactionType === 6;
    const isExchangeDeposit = transaction.transactionType === 8;
    const isExchangeWithdraw = transaction.transactionType === 9;
    
    let isTransferIn = false;
    let isTransferOut = false;
    
    if (isTransfer) {
      if (transaction.accountId === currentAccountId) {
        isTransferOut = true;
      }
      else if (transaction.targetAccountId === currentAccountId) {
        isTransferIn = true;
      }
    }

    if (isExchangeBuy) {
      return {
        type: 'Döviz Alış',
        color: 'text-red-600',
        sign: '-'
      };
    }
    
    if (isExchangeSell) {
      return {
        type: 'Döviz Satış',
        color: 'text-green-600',
        sign: '+'
      };
    }
    
    if (isExchangeDeposit) {
      return {
        type: 'Döviz Girişi',
        color: 'text-green-600',
        sign: '+'
      };
    }
    
    if (isExchangeWithdraw) {
      return {
        type: 'Döviz Çıkışı',
        color: 'text-red-600',
        sign: '-'
      };
    }

    return {
      type: isDeposit ? 'Para Yatırma' :
            isWithdraw ? 'Para Çekme' :
            isTransferIn ? 'Transfer (Gelen)' :
            isTransferOut ? 'Transfer (Giden)' : 'Bilinmeyen',
      color: (isDeposit || isTransferIn) ? 'text-green-600' :
             (isWithdraw || isTransferOut) ? 'text-red-600' : 'text-gray-600',
      sign: (isDeposit || isTransferIn) ? '+' : '-'
    };
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="flex w-full flex-row max-xl:max-h-screen max-xl:overflow-y-scroll">
      <div className="flex w-full flex-1 flex-col gap-8 px-5 sm:px-8 py-7 lg:py-12 xl:max-h-screen xl:overflow-y-scroll">
        <header>
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={handleGoBack}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">İşlem Geçmişi</h1>
          </div>
          <HeaderBox 
            title=""
            subtext="Hesap işlemlerinizi görüntüleyin ve filtreleyin"
          />
        </header>

        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">İşlem geçmişini görüntülemek için önce hesap açmalısınız.</p>
            <Button 
              onClick={() => router.push('/my-banks')}
              className="mt-4 bg-bankGradient text-white"
            >
              Hesap Aç
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {/* Quick Filters */}
            <div className="bg-white rounded-xl shadow-chart border border-gray-200 p-6">
              <h3 className="text-18 font-semibold mb-4">Hızlı Filtreler</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'today', label: 'Bugün' },
                  { key: '7days', label: 'Son 7 Gün' },
                  { key: '1month', label: 'Son 1 Ay' },
                  { key: '3months', label: 'Son 3 Ay' },
                  { key: '6months', label: 'Son 6 Ay' },
                  { key: '1year', label: 'Son 1 Yıl' },
                  { key: 'all', label: 'Tümü' }
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    onClick={() => handleQuickFilter(filter.key)}
                    variant={quickFilter === filter.key ? "default" : "outline"}
                    className={quickFilter === filter.key ? "bg-bankGradient text-white" : ""}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Advanced Filters */}
            <form onSubmit={handleFilter} className="bg-white rounded-xl shadow-chart border border-gray-200 p-6 space-y-6">
              <h3 className="text-18 font-semibold">Gelişmiş Filtreler</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hesap
                  </label>
                  <select
                    value={selectedAccountId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const accountId = value && value !== '' ? parseInt(value) : undefined;
                      setSelectedAccountId(accountId);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-bankGradient"
                  >
                    <option value="">Tüm Hesaplar</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.iban} - {getCurrencySymbol(account.currencyType)}{account.balance.toLocaleString('tr-TR')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-bankGradient"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-bankGradient"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="bg-bankGradient text-white"
              >
                {loading ? 'Filtreleniyor...' : 'Filtrele'}
              </Button>
            </form>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}


            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-chart border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-18 font-semibold">
                  İşlemler ({filteredTransactions.length})
                </h3>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-600">
                  İşlemler yükleniyor...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  Seçilen kriterlere uygun işlem bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IBAN
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarih
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Açıklama
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tür
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tutar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Komisyon
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bakiye
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.map((transaction, index) => {
                        const account = accounts.find(acc => acc.id === transaction.accountId);
                        const transactionInfo = getTransactionInfo(transaction, transaction.accountId);
                        
                        return (
                          <tr key={transaction.id || `transaction-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {account ? account.iban : `Hesap ${transaction.accountId}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(() => {
                                const date = new Date(transaction.transactionDate);
                                // GMT+3 timezone'a çevir
                                const dateGMT3 = new Date(date.getTime() + (3 * 60 * 60 * 1000));
                                return dateGMT3.toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'Europe/Istanbul'
                                });
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.description || 'Açıklama yok'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-medium ${transactionInfo.color}`}>
                                {transactionInfo.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-semibold ${
                                (transaction.transactionType === 1) || 
                                (transaction.transactionType === 3 && transaction.targetAccountId === transaction.accountId) ||
                                (transaction.transactionType === 4) || // Fee transaction'ları pozitif göster
                                (transaction.transactionType === 6) || // Döviz Satış pozitif
                                (transaction.transactionType === 8)    // Döviz Girişi pozitif
                                    ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {(transaction.transactionType === 1) || 
                                 (transaction.transactionType === 3 && transaction.targetAccountId === transaction.accountId) ||
                                 (transaction.transactionType === 4) || // Fee transaction'ları pozitif göster
                                 (transaction.transactionType === 6) || // Döviz Satış pozitif
                                 (transaction.transactionType === 8)    // Döviz Girişi pozitif
                                    ? '+' : '-'}
                                {getCurrencySymbol(account?.currencyType || 0)}
                                {Math.abs(transaction.amount).toLocaleString('tr-TR', { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(() => {
                                if (transaction.transactionType === 4) {
                                  return <span className="text-orange-600 text-xs">İşlem Ücreti</span>;
                                }
                                const isIncomingTransfer = transaction.transactionType === 3 && transaction.targetAccountId === transaction.accountId;
                                if (isIncomingTransfer) return '-';
                                if (!transaction.fee || transaction.fee === 0) return '-';
                                return (
                                  <div>
                                    {getCurrencySymbol(account?.currencyType || 0)}
                                    {transaction.fee.toLocaleString('tr-TR', { 
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {getCurrencySymbol(account?.currencyType || 0)}
                              {transaction.balanceAfter?.toLocaleString('tr-TR', { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }) || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            
          </div>
        )}
      </div>
    </section>
  );
};

export default TransactionHistory;