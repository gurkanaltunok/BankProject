'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { Button } from '@/components/ui/button';
import HeaderBox from '@/components/HeaderBox';
import { AccountType, CurrencyType, getAccountTypeLabel, getCurrencyTypeLabel, getCurrencySymbol } from '@/types/enums';

const MyBanks = () => {
  const { isAuthenticated } = useAuth();
  const { accounts, loading, createAccount, deleteAccount } = useAccounts();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [newAccount, setNewAccount] = useState({
    currencyType: CurrencyType.TRY,
    accountType: AccountType.Vadesiz,
  });

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      await createAccount(newAccount);
      setShowCreateForm(false);
      setNewAccount({ currencyType: CurrencyType.TRY, accountType: AccountType.Vadesiz });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (confirm('Bu hesabı silmek istediğinizden emin misiniz?')) {
      try {
        await deleteAccount(accountId);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="flex w-full flex-row max-xl:max-h-screen max-xl:overflow-y-scroll">
      <div className="flex w-full flex-1 flex-col gap-8 px-5 sm:px-8 py-7 lg:py-12 xl:max-h-screen xl:overflow-y-scroll">
        <header>
          <HeaderBox 
            title="Hesaplarım"
            subtext="Banka hesaplarınızı yönetin"
          />
        </header>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-20 font-semibold text-gray-900">
              Hesap Listesi ({accounts.length})
            </h2>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-bankGradient text-white"
            >
              Yeni Hesap Aç
            </Button>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Create Account Form */}
          {showCreateForm && (
            <div className="border rounded-lg p-6 bg-gray-50">
              <h3 className="text-18 font-semibold mb-4">Yeni Hesap Oluştur</h3>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hesap Türü
                  </label>
                  <select
                    value={newAccount.accountType}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, accountType: parseInt(e.target.value) as AccountType }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-bankGradient"
                  >
                    <option value={AccountType.Vadesiz}>Vadesiz Hesap</option>
                    <option value={AccountType.Vadeli}>Vadeli Hesap</option>
                    <option value={AccountType.Kredi}>Kredi Hesabı</option>
                    <option value={AccountType.Ticari}>Ticari Hesap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Para Birimi
                  </label>
                  <select
                    value={newAccount.currencyType}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, currencyType: parseInt(e.target.value) as CurrencyType }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-bankGradient"
                  >
                    <option value={CurrencyType.TRY}>Türk Lirası (TRY)</option>
                    <option value={CurrencyType.USD}>Amerikan Doları (USD)</option>
                    <option value={CurrencyType.EUR}>Euro (EUR)</option>
                    <option value={CurrencyType.GBP}>İngiliz Sterlini (GBP)</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="bg-bankGradient text-white"
                  >
                    {creating ? 'Oluşturuluyor...' : 'Hesap Aç'}
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Accounts List */}
          {loading ? (
            <div className="text-center py-8">Hesaplar yükleniyor...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              Henüz hesabınız bulunmuyor. Yeni hesap açmak için yukarıdaki butonu kullanın.
            </div>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-18 font-semibold">{account.iban}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Hesap Türü: {getAccountTypeLabel(account.accountType || 0)}</p>
                        <p>Para Birimi: {getCurrencyTypeLabel(account.currencyType || 0)}</p>
                        <p>Açılış Tarihi: {new Date(account.dateCreated).toLocaleDateString('tr-TR')}</p>
                        <p>Durum: {account.isActive ? 'Aktif' : 'Pasif'}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-24 font-bold text-bankGradient">
                        {getCurrencySymbol(account.currencyType || 0)}{account.balance.toLocaleString('tr-TR', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                      <div className="space-y-2">
                        <Button
                          onClick={() => router.push(`/payment-transfer?accountId=${account.id}`)}
                          className="w-full bg-bankGradient text-white text-sm py-2"
                        >
                          İşlem Yap
                        </Button>
                        <Button
                          onClick={() => router.push(`/transaction-history?accountId=${account.id}`)}
                          className="w-full border border-bankGradient text-bankGradient bg-white hover:bg-gray-50 text-sm py-2"
                        >
                          İşlem Geçmişi
                        </Button>
                        {account.balance === 0 && (
                          <Button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="w-full bg-red-500 text-white hover:bg-red-600 text-sm py-2"
                          >
                            Hesabı Kapat
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MyBanks;