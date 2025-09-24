'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { Button } from '@/components/ui/button';
import HeaderBox from '@/components/HeaderBox';
import { AccountType, CurrencyType, getAccountTypeLabel, getCurrencyTypeLabel, getCurrencySymbol } from '@/types/enums';
import { apiService } from '@/lib/api';
import { useExchangeRates } from '@/lib/hooks/useExchangeRates';
import { ArrowLeft } from 'lucide-react';

const MyBanks = () => {
  const { isAuthenticated } = useAuth();
  const { accounts, loading, createAccount, deleteAccount } = useAccounts();
  const { convertToTRY } = useExchangeRates();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [totalBalanceInTRY, setTotalBalanceInTRY] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  useEffect(() => {
    if (isAuthenticated) {
      loadTotalBalance();
    }
  }, [isAuthenticated]);

  const loadTotalBalance = async () => {
    try {
      const totalBalance = await apiService.getMyTotalBalance();
      setTotalBalanceInTRY(totalBalance);
    } catch (error) {
      console.error('Error loading total balance:', error);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      await createAccount(newAccount);
      setShowCreateForm(false);
      setNewAccount({ currencyType: CurrencyType.TRY, accountType: AccountType.Vadesiz });
      // Yeni hesap oluşturulduktan sonra toplam bakiyeyi yenile
      await loadTotalBalance();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAccount = (accountId: number) => {
    setAccountToDelete(accountId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    
    setDeleting(true);
    try {
      await deleteAccount(accountToDelete);
      // Hesap silindikten sonra toplam bakiyeyi yenile
      await loadTotalBalance();
      setShowDeleteConfirm(false);
      setAccountToDelete(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
    setAccountToDelete(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="flex w-full flex-row max-xl:max-h-screen max-xl:overflow-y-scroll">
      <div className="flex w-full flex-1 flex-col gap-8 px-5 sm:px-8 py-7 lg:py-12 xl:max-h-screen xl:overflow-y-scroll">
        <header>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleGoBack}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Geri
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Hesaplarım
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-gray-600">
                  {accounts.length} hesap • Toplam bakiye: {getCurrencySymbol(0)}{totalBalanceInTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Yeni Hesap Aç
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-6">

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Create Account Form */}
          {showCreateForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Yeni Hesap Oluştur</h3>
                  <p className="text-gray-600 text-sm mt-1">Hesap türünü ve para birimini seçin</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateAccount} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Hesap Türü
                    </label>
                    <select
                      value={newAccount.accountType}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, accountType: parseInt(e.target.value) as AccountType }))}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    >
                      <option value={AccountType.Vadesiz}>Vadesiz Hesap</option>
                      <option value={AccountType.Vadeli}>Vadeli Hesap</option>
                      <option value={AccountType.Kredi}>Kredi Hesabı</option>
                      <option value={AccountType.Ticari}>Ticari Hesap</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Para Birimi
                    </label>
                    <select
                      value={newAccount.currencyType}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, currencyType: parseInt(e.target.value) as CurrencyType }))}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    >
                      <option value={CurrencyType.TRY}>Türk Lirası (TRY)</option>
                      <option value={CurrencyType.USD}>Amerikan Doları (USD)</option>
                      <option value={CurrencyType.EUR}>Euro (EUR)</option>
                      <option value={CurrencyType.GBP}>İngiliz Sterlini (GBP)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 py-3"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Hesap Aç
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 sm:flex-none border-2 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 py-3"
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Accounts List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">Hesaplar yükleniyor...</p>
              </div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz hesabınız yok</h3>
                <p className="text-gray-600 mb-6">İlk hesabınızı oluşturarak bankacılık işlemlerinize başlayın.</p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                >
                  İlk Hesabımı Aç
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts
                .slice()
                .sort((a, b) => {
                  // Inactive accounts last
                  if (a.isActive !== b.isActive) {
                    return a.isActive ? -1 : 1;
                  }
                  // Sort by balance converted to TRY (desc)
                  const aTry = convertToTRY(a.balance || 0, a.currencyType || 0);
                  const bTry = convertToTRY(b.balance || 0, b.currencyType || 0);
                  return bTry - aTry;
                })
                .map((account) => (
                <div key={account.id} className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                  {/* Status Indicator */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="relative">
                      {/* Background circle with low opacity */}
                      <div className={`w-6 h-6 rounded-full ${account.isActive ? 'bg-green-500/20' : 'bg-red-500/20'} absolute -inset-1.5`}></div>
                      {/* Main status circle */}
                      <div className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-red-500'} shadow-sm relative z-10`}>
                        <div className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                      </div>
                    </div>
                  </div>

                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {getAccountTypeLabel(account.accountType || 0)}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {getCurrencyTypeLabel(account.currencyType || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* IBAN */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">IBAN</p>
                      <p className="font-mono text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {account.iban}
                      </p>
                    </div>

                    {/* Balance */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Bakiye</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {getCurrencySymbol(account.currencyType || 0)}{account.balance.toLocaleString('tr-TR', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>

                    {/* Account Info */}
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Açılış:</span>
                        <span>{new Date(account.dateCreated).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Durum:</span>
                        <span className={`font-medium ${account.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {account.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 pb-6 space-y-3">
                    <Button
                      onClick={() => router.push(`/payment-transfer?accountId=${account.id}`)}
                      disabled={!account.isActive}
                      className={`w-full py-2.5 text-sm font-medium transition-all duration-200 ${
                        account.isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {account.isActive ? 'İşlem Yap' : 'Hesap Pasif'}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => router.push(`/account/${account.id}`)}
                        className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 py-2 text-xs font-medium"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Detay
                      </Button>
                      
                      {account.balance === 0 && account.isActive && (
                        <Button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 transition-all duration-200 py-2 text-xs font-medium"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Kapat
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Hesabı Kapat</h3>
            </div>

            {/* Modal Content */}
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Bu hesabı kapatmak istediğinizden emin misiniz?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  <strong>Dikkat:</strong> Bu işlem geri alınamaz. Hesap kapatıldıktan sonra tüm işlemler durdurulacaktır.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <Button
                onClick={cancelDeleteAccount}
                variant="outline"
                className="flex-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={deleting}
              >
                İptal
              </Button>
              <Button
                onClick={confirmDeleteAccount}
                className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Kapatılıyor...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hesabı Kapat
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MyBanks;