'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import HeaderBox from '@/components/HeaderBox';

const TransactionHistory = () => {
  const { isAuthenticated } = useAuth();
  const { accounts, getCurrencySymbol } = useAccounts();
  const { transactions, loading, getTransactionsByDateRange, getTransactionsByAccount } = useTransactions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get('accountId');

  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [quickFilter, setQuickFilter] = useState('');

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  // Initialize from URL params
  useEffect(() => {
    if (accountIdParam) {
      setSelectedAccountId(parseInt(accountIdParam));
    }
  }, [accountIdParam]);

  // Set default date range to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  // Set default account selection (only on first load)
  useEffect(() => {
    if (accounts.length > 0 && selectedAccountId === undefined && !accountIdParam) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, accountIdParam]);

  // Load transactions function
  const loadTransactions = async (accountId?: number) => {
    try {
      setError('');
      const finalAccountId = accountId !== undefined ? accountId : selectedAccountId;
      console.log('loadTransactions called with:', { accountId, selectedAccountId, finalAccountId });
      
      let result;
      if (finalAccountId) {
        // Belirli bir account seçiliyse getTransactionsByAccount kullan
        console.log('Using getTransactionsByAccount for account:', finalAccountId);
        result = await getTransactionsByAccount(finalAccountId);
      } else {
        // Tüm hesaplar için getTransactionsByDateRange kullan (tarih filtreleme yapmadan)
        console.log('Using getTransactionsByDateRange for all accounts (no date filter)');
        result = await getTransactionsByDateRange(
          undefined, // startDate
          undefined, // endDate
          undefined  // accountId
        );
      }
      console.log('loadTransactions result:', result);
    } catch (err: any) {
      console.error('loadTransactions error:', err);
      setError(err.message);
    }
  };

  // Load transactions when accounts are loaded
  useEffect(() => {
    if (accounts.length > 0 && selectedAccountId !== undefined) {
      console.log('useEffect çalıştı, selectedAccountId:', selectedAccountId);
      loadTransactions();
    }
  }, [accounts.length, selectedAccountId]);

  // Handle account selection
  const handleAccountChange = async (accountId: number | undefined) => {
    console.log('handleAccountChange called with:', accountId);
    setSelectedAccountId(accountId);
    console.log('setSelectedAccountId called, new value should be:', accountId);
    // loadTransactions'ı useEffect'te çağıracağız, burada çağırmaya gerek yok
  };

  // Handle form submission
  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleFilter called with selectedAccountId:', selectedAccountId);
    // Form submission'da account seçiliyse getTransactionsByAccount kullan
    if (selectedAccountId) {
      console.log('Form filter: Using getTransactionsByAccount for account:', selectedAccountId);
      await getTransactionsByAccount(selectedAccountId);
    } else {
      console.log('Form filter: Using getTransactionsByDateRange for all accounts (no date filter)');
      await getTransactionsByDateRange(undefined, undefined, undefined);
    }
  };

  // Handle quick filters
  const handleQuickFilter = async (filter: string) => {
    setQuickFilter(filter);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (filter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case '7days':
        start.setDate(today.getDate() - 7);
        break;
      case '1month':
        start.setMonth(today.getMonth() - 1);
        break;
      case '3months':
        start.setMonth(today.getMonth() - 3);
        break;
      case '6months':
        start.setMonth(today.getMonth() - 6);
        break;
      case '1year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'all':
        start = new Date(0);
        end = new Date();
        break;
    }

    const newStartDate = start.toISOString().split('T')[0];
    const newEndDate = end.toISOString().split('T')[0];
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // Tarih değiştikten sonra transaction'ları yeniden yükle
    console.log('Quick filter applied, reloading transactions...');
    // Quick filter'lar sadece tarih değiştiriyor, account seçiliyse getTransactionsByAccount kullan
    if (selectedAccountId) {
      console.log('Quick filter: Using getTransactionsByAccount for account:', selectedAccountId);
      await getTransactionsByAccount(selectedAccountId);
    } else {
      console.log('Quick filter: Using getTransactionsByDateRange for all accounts (no date filter)');
      await getTransactionsByDateRange(undefined, undefined, undefined);
    }
  };


  // Get transaction type display info
  const getTransactionInfo = (transaction: any, currentAccountId: number) => {
    const isFee = transaction.transactionType === 4 || transaction.description?.includes('İşlem Ücreti') || false;
    
    // İşlem ücreti ise diğer kontrolleri yapma
    if (isFee) {
      return {
        type: 'İşlem Ücreti',
        color: 'text-red-600',
        sign: '-'
      };
    }
    
    const isDeposit = transaction.transactionType === 1;
    const isWithdraw = transaction.transactionType === 2;
    const isTransfer = transaction.transactionType === 3;
    
    // Transfer işlemleri için doğru kategorilendirme
    let isTransferIn = false;
    let isTransferOut = false;
    
    if (isTransfer) {
      // Eğer bu hesap transferin kaynak hesabı ise (para çıkıyor)
      if (transaction.accountId === currentAccountId) {
        isTransferOut = true;
      }
      // Eğer bu hesap transferin hedef hesabı ise (para giriyor)
      else if (transaction.targetAccountId === currentAccountId) {
        isTransferIn = true;
      }
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
          <HeaderBox 
            title="İşlem Geçmişi"
            subtext="Hesap işlemlerinizi görüntüleyin ve filtreleyin"
          />
        </header>

        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">İşlem geçmişini görüntülemek için önce hesap açmalısınız.</p>
            <Button 
              onClick={() => router.push('/my-banks')}
              className="mt-4 bg-bankGradient text-white"
            >
              Hesap Aç
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Filters */}
            <div className="bg-white p-6 rounded-lg border">
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
            <form onSubmit={handleFilter} className="bg-white p-6 rounded-lg border space-y-4">
              <h3 className="text-18 font-semibold">Gelişmiş Filtreler</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hesap
                  </label>
                  <select
                    value={selectedAccountId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const accountId = value && value !== '' ? parseInt(value) : undefined;
                      console.log('Dropdown onChange:', { value, accountId, selectedAccountId });
                      handleAccountChange(accountId);
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
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-18 font-semibold">
                  İşlemler ({transactions.filter(t => t.transactionType !== 4).length})
                </h3>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-600">
                  İşlemler yükleniyor...
                </div>
              ) : transactions.length === 0 ? (
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
                      {transactions
                        .filter(transaction => {
                          // İşlem ücreti transaction'larını filtrele (transactionType === 4)
                          return transaction.transactionType !== 4;
                        })
                        .map((transaction, index) => {
                        const account = accounts.find(acc => acc.id === transaction.accountId);
                        const transactionInfo = getTransactionInfo(transaction, transaction.accountId);
                        
                        return (
                          <tr key={transaction.id || `transaction-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {account ? account.iban : `Hesap ${transaction.accountId}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(transaction.transactionDate).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
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
                              <span className={`font-semibold ${transactionInfo.color}`}>
                                {transactionInfo.sign}
                                {getCurrencySymbol(account?.currencyType || 0)}
                                {Math.abs(transaction.amount).toLocaleString('tr-TR', { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.fee ? (
                                <>
                                  {getCurrencySymbol(account?.currencyType || 0)}
                                  {transaction.fee.toLocaleString('tr-TR', { 
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </>
                              ) : '-'}
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

            {/* Summary */}
            {transactions.filter(t => t.transactionType !== 4).length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Özet</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Toplam İşlem: </span>
                    <span className="font-semibold">{transactions.filter(t => t.transactionType !== 4).length}</span>
                  </div>
                  <div>
                    <span className="text-green-700 font-semibold">Para Yatırma: </span>
                    <span className="font-bold text-green-800">
                      {transactions.filter(t => t.transactionType === 1).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-700 font-semibold">Para Çekme: </span>
                    <span className="font-bold text-red-800">
                      {transactions.filter(t => t.transactionType === 2).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700 font-semibold">Transfer (Gelen): </span>
                    <span className="font-bold text-green-800">
                      {transactions.filter(t => t.transactionType === 3 && t.targetAccountId === selectedAccountId).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-700 font-semibold">Transfer (Giden): </span>
                    <span className="font-bold text-red-800">
                      {transactions.filter(t => t.transactionType === 3 && t.accountId === selectedAccountId).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TransactionHistory;