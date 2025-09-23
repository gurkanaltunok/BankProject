'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiService } from '@/lib/api';
import { getAccountTypeLabel, getCurrencyTypeLabel, getCurrencySymbol } from '@/types/enums';
import HeaderBox from '@/components/HeaderBox';

interface Transaction {
  id: number;
  amount: number;
  description: string;
  transactionDate: string;
  transactionType: number;
  fee?: number;
  feeInTRY?: number;
  exchangeRate?: {
    exchangeRateId: number;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    date: string;
    source?: string;
  };
  targetAccountId?: number;
}

const AdminAccountDetail = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;

  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    } else if (user?.roleId !== 2) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, user, router]);

  useEffect(() => {
    if (user?.roleId === 2 && accountId) {
      loadAccountData();
    }
  }, [user, accountId]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get account details
      const account = await apiService.getAccountById(Number(accountId));
      setSelectedAccount(account);
      
      // Get transactions for this account
      const accountTransactions = await apiService.getTransactionsByAccount(Number(accountId));
      setTransactions(accountTransactions);
      
    } catch (error: any) {
      console.error('Account data yüklenirken hata:', error);
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0 && selectedAccount) {
      
      let filtered = transactions.filter(t => {
        const isAccountTransaction = (t.accountId === Number(selectedAccount.accountId) || t.targetAccountId === Number(selectedAccount.accountId));
        
        // Admin kullanıcıları fee transaction'larını görebilir
        return isAccountTransaction;
      });
      

      // Date filtering
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(t => {
            const transactionDate = new Date(t.transactionDate);
            return transactionDate.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(t => new Date(t.transactionDate) >= weekAgo);
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(t => new Date(t.transactionDate) >= monthAgo);
          break;
      }

      setFilteredTransactions(filtered);
    }
  }, [transactions, selectedAccount, dateFilter]);

  const getTransactionTypeLabel = (type: number) => {
    switch (type) {
      case 1: return 'Para Yatırma';
      case 2: return 'Para Çekme';
      case 3: return 'Transfer';
      case 4: return 'İşlem Ücreti';
      default: return 'Bilinmeyen';
    }
  };

  const getTransactionTypeColor = (type: number) => {
    switch (type) {
      case 1: return 'text-green-600';
      case 2: return 'text-red-600';
      case 3: return 'text-blue-600';
      case 4: return 'text-orange-600';
      default: return 'text-gray-600';
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
            onClick={loadAccountData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Hesap bulunamadı</div>
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
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox 
            type="greeting"
            title="Hesap Detayı"
            user={selectedAccount.iban || 'Hesap'}
            subtext="Hesap bilgileri ve işlem geçmişi"
          />
        </header>

        {/* Back Button */}
        <div className="flex justify-start mb-6">
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

        {/* Account Information */}
        <div className="mt-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-20 font-semibold text-gray-900 mb-4">Hesap Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">IBAN</p>
                <p className="font-semibold">{selectedAccount.iban}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hesap Türü</p>
                <p className="font-semibold">{getAccountTypeLabel(selectedAccount.accountType || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Para Birimi</p>
                <p className="font-semibold">{getCurrencyTypeLabel(selectedAccount.currencyType || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bakiye</p>
                <p className="font-semibold text-lg">
                  {getCurrencySymbol(selectedAccount.currencyType || 0)}
                  {(selectedAccount.balance || 0).toLocaleString('tr-TR', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Açılış Tarihi</p>
                <p className="font-semibold">
                  {selectedAccount.dateCreated ? new Date(selectedAccount.dateCreated).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durum</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedAccount.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedAccount.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-20 font-semibold text-gray-900">İşlem Geçmişi</h2>
              <div className="flex space-x-2">
                {(['all', 'today', 'week', 'month'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      dateFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {filter === 'all' ? 'Tümü' : 
                     filter === 'today' ? 'Bugün' :
                     filter === 'week' ? 'Bu Hafta' : 'Bu Ay'}
                  </button>
                ))}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Bu hesap için işlem bulunamadı</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlem Türü
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Açıklama
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
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.transactionDate).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getTransactionTypeColor(transaction.transactionType)}`}>
                            {getTransactionTypeLabel(transaction.transactionType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-semibold ${
                            (transaction.transactionType === 1) || 
                            (transaction.transactionType === 3 && transaction.targetAccountId === selectedAccount?.id) ||
                            (transaction.transactionType === 4)
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(transaction.transactionType === 1) || 
                             (transaction.transactionType === 3 && transaction.targetAccountId === selectedAccount?.id) ||
                             (transaction.transactionType === 4)
                              ? '+' : '-'}
                            {getCurrencySymbol(selectedAccount.currencyType || 0)}
                            {Math.abs(transaction.amount).toLocaleString('tr-TR', { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.transactionType === 4 ? (
                            <span className="text-orange-600 text-xs">İşlem Ücreti</span>
                          ) : transaction.fee ? (
                            <div className="space-y-1">
                              <div>
                                {getCurrencySymbol(selectedAccount.currencyType || 0)}
                                {transaction.fee.toLocaleString('tr-TR', { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </div>
                              {transaction.feeInTRY && transaction.feeInTRY !== transaction.fee && (
                                <div className="text-xs text-gray-500">
                                  (₺{transaction.feeInTRY.toLocaleString('tr-TR', { 
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })})
                                </div>
                              )}
                              {transaction.exchangeRate && (
                                <div className="text-xs text-blue-600">
                                  Kur: {transaction.exchangeRate.rate.toFixed(4)}
                                </div>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCurrencySymbol(selectedAccount.currencyType || 0)}
                          {(transaction.balanceAfter || 0).toLocaleString('tr-TR', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminAccountDetail;
