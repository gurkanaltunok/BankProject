'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { useBalanceHistory } from '@/lib/hooks/useBalanceHistory';
import { getAccountTypeLabel, getCurrencyTypeLabel, getCurrencySymbol } from '@/types/enums';
import HeaderBox from '@/components/HeaderBox';
import BalanceHistoryChart from '@/components/BalanceHistoryChart';
import { formatAmount } from '@/lib/utils';

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

const AccountDetail = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, loading: transactionsLoading, getTransactionsByAccount } = useTransactions();
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;

  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const { balanceHistory, loading: balanceHistoryLoading } = useBalanceHistory(selectedAccount?.id);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const loadedAccountId = useRef<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    console.log('Account detail useEffect - accounts:', accounts, 'accountId:', accountId);
    if (accounts.length > 0 && accountId) {
      const account = accounts.find(acc => acc.id?.toString() === accountId || acc.id === Number(accountId));
      console.log('Found account:', account);
      if (account) {
        setSelectedAccount(account);
        // Only fetch transactions if we haven't loaded them for this account yet
        if (loadedAccountId.current !== Number(account.id)) {
          console.log('Fetching transactions for account:', account.id);
          loadedAccountId.current = Number(account.id);
          getTransactionsByAccount(Number(account.id));
        }
      } else {
        router.push('/');
      }
    }
  }, [accounts, accountId, router, getTransactionsByAccount]);

  useEffect(() => {
    console.log('Filter useEffect - transactions:', transactions, 'selectedAccount:', selectedAccount, 'dateFilter:', dateFilter);
    if (transactions.length > 0 && selectedAccount) {
      console.log('Transaction accountId:', transactions[0]?.accountId, 'type:', typeof transactions[0]?.accountId);
      console.log('SelectedAccount id:', selectedAccount.id, 'type:', typeof selectedAccount.id);
      console.log('Number(selectedAccount.id):', Number(selectedAccount.id));
      
      let filtered = transactions.filter(t => {
        const isAccountTransaction = (t.accountId === Number(selectedAccount.id) || t.targetAccountId === Number(selectedAccount.id));
        
        // Admin kullanıcıları fee transaction'larını görebilir, normal kullanıcılar göremez
        if (user?.roleId === 2) {
          return isAccountTransaction; // Admin: tüm transaction'ları göster
        } else {
          return isAccountTransaction && t.transactionType !== 4; // Normal kullanıcı: fee transaction'larını gizle
        }
      });
      console.log('Filtered by account (excluding fees):', filtered);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(t => new Date(t.transactionDate) >= today);
          break;
        case 'week':
          filtered = filtered.filter(t => new Date(t.transactionDate) >= weekAgo);
          break;
        case 'month':
          filtered = filtered.filter(t => new Date(t.transactionDate) >= monthAgo);
          break;
        default:
          // Show all transactions
          break;
      }

      console.log('Final filtered transactions:', filtered);
      setFilteredTransactions(filtered);
    } else {
      console.log('No transactions or selectedAccount, setting empty array');
      setFilteredTransactions([]);
    }
  }, [transactions, selectedAccount, dateFilter, user]);

  const getTransactionTypeLabel = (type: number, transaction: any) => {
    switch (type) {
      case 1: return 'Para Yatırma';
      case 2: return 'Para Çekme';
      case 3: 
        if (transaction.targetAccountId === selectedAccount?.id) {
          return 'Transfer (Gelen)';
        } else {
          return 'Transfer (Giden)';
        }
      case 4: return 'İşlem Ücreti';
      default: return 'Bilinmeyen';
    }
  };

  const getTransactionTypeColor = (type: number) => {
    switch (type) {
      case 1: return 'text-green-600';
      case 2: return 'text-red-600';
      case 3: return 'text-blue-600';
      case 4: return 'text-orange-600'; // Fee transaction'ları için turuncu
      default: return 'text-gray-600';
    }
  };

  if (authLoading || accountsLoading) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAuthenticated || !selectedAccount) {
    return null;
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
                  {new Date(selectedAccount.dateCreated).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durum</p>
                <p className="font-semibold">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedAccount.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedAccount.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance History Chart */}
        <div className="mt-8">
          <BalanceHistoryChart 
            balanceHistory={balanceHistory} 
            loading={balanceHistoryLoading} 
          />
        </div>

        {/* Transaction History */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-20 font-semibold text-gray-900">İşlem Geçmişi</h2>
            
            {/* Date Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1 rounded-md text-sm ${
                  dateFilter === 'today' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bugün
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1 rounded-md text-sm ${
                  dateFilter === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Son 7 Gün
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1 rounded-md text-sm ${
                  dateFilter === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Son 1 Ay
              </button>
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 rounded-md text-sm ${
                  dateFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü
              </button>
            </div>
          </div>

          {transactionsLoading ? (
            <div className="text-center py-8 text-gray-600">
              İşlemler yükleniyor...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              Seçilen tarih aralığında işlem bulunamadı.
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
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
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
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
                          <span className={`font-medium ${getTransactionTypeColor(transaction.transactionType)}`}>
                            {getTransactionTypeLabel(transaction.transactionType, transaction)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-semibold ${
                            (transaction.transactionType === 1) || 
                            (transaction.transactionType === 3 && transaction.targetAccountId === selectedAccount?.id) ||
                            (transaction.transactionType === 4) // Fee transaction'ları pozitif göster
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(transaction.transactionType === 1) || 
                             (transaction.transactionType === 3 && transaction.targetAccountId === selectedAccount?.id) ||
                             (transaction.transactionType === 4) // Fee transaction'ları pozitif göster
                              ? '+' : '-'}
                            {getCurrencySymbol(selectedAccount.currencyType || 0)}
                            {Math.abs(transaction.amount).toLocaleString('tr-TR', { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.fee ? (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getCurrencySymbol(selectedAccount.currencyType || 0)}
                          {transaction.balanceAfter?.toLocaleString('tr-TR', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }) || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            ← Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </section>
  );
};

export default AccountDetail;
