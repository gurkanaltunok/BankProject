'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { apiService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import HeaderBox from '@/components/HeaderBox';

const PaymentTransfer = () => {
  const { isAuthenticated } = useAuth();
  const { accounts, getCurrencyTypeLabel, getCurrencySymbol } = useAccounts();
  const { deposit, withdraw, transfer } = useTransactions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get('accountId');

  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [targetIban, setTargetIban] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    console.log('Payment Transfer - accounts:', accounts);
    console.log('Payment Transfer - accountIdParam:', accountIdParam);
    if (accountIdParam && accounts.length > 0) {
      console.log('Setting selectedAccountId from param:', parseInt(accountIdParam));
      setSelectedAccountId(parseInt(accountIdParam));
    } else if (accounts.length > 0) {
      console.log('Setting selectedAccountId from first account:', accounts[0].id);
      setSelectedAccountId(accounts[0].id);
    }
  }, [accountIdParam, accounts]);

  const selectedAccount = accounts.find(account => account.id === selectedAccountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    console.log('HandleSubmit - selectedAccountId:', selectedAccountId);
    console.log('HandleSubmit - accounts:', accounts);
    console.log('HandleSubmit - selectedAccount:', selectedAccount);

    try {
      const amountValue = parseFloat(amount);
      
      if (amountValue <= 0) {
        throw new Error('Geçerli bir tutar girin');
      }

      if (!selectedAccountId || selectedAccountId === 0) {
        throw new Error('Lütfen bir hesap seçin');
      }

      let targetAccount = null;
      let targetAccountId = 0;
      
      if (transactionType === 'transfer') {
        if (!targetIban.trim()) {
          throw new Error('Hedef IBAN girin');
        }
        
        // IBAN'ı temizle (boşlukları kaldır)
        const cleanIban = targetIban.replace(/\s/g, '');
        
        // IBAN formatını kontrol et
        if (!/^TR\d{2}\d{22}$/.test(cleanIban)) {
          throw new Error('Geçerli bir IBAN formatı girin (TR00 0000 0000 0000 0000 0000 00)');
        }
        
        // IBAN'dan targetAccountId bul
        // Önce kendi hesaplarında ara
        targetAccount = accounts.find(acc => acc.iban === cleanIban);
        
        if (targetAccount) {
          console.log('Found account in local accounts:', targetAccount);
          targetAccountId = targetAccount.accountId || targetAccount.id;
        } else {
          // Eğer kendi hesaplarında bulunamazsa, API'den tüm hesaplarda ara
          try {
            targetAccount = await apiService.getAccountByIban(cleanIban);
            console.log('Found account via API:', targetAccount);
            targetAccountId = targetAccount.accountId || targetAccount.id;
          } catch (apiError) {
            console.log('API error:', apiError);
            throw new Error('Bu IBAN numarasına sahip hesap bulunamadı. Lütfen geçerli bir IBAN girin.');
          }
        }
        
        console.log('Final targetAccountId:', targetAccountId);
        
        if (targetAccountId === selectedAccountId) {
          throw new Error('Aynı hesaba transfer yapamazsınız');
        }

        // Para birimi kontrolü - aynı para biriminde olmalı
        if (targetAccount && selectedAccount) {
          if (targetAccount.currencyType !== selectedAccount.currencyType) {
            const fromCurrency = selectedAccount.currencyType === 0 ? 'TRY' : selectedAccount.currencyType === 1 ? 'USD' : 'EUR';
            const toCurrency = targetAccount.currencyType === 0 ? 'TRY' : targetAccount.currencyType === 1 ? 'USD' : 'EUR';
            throw new Error(`Farklı para birimlerinden transfer yapılamaz. Gönderen hesap: ${fromCurrency}, Alıcı hesap: ${toCurrency}`);
          }
        }
      }

      // Onay sayfasına yönlendir
      const transactionData = {
        transactionType: transactionType,
        amount: amountValue,
        description: description,
        selectedAccountId: selectedAccountId,
        targetIban: targetIban,
        targetAccountId: targetAccountId
      };
      
      const encodedData = encodeURIComponent(JSON.stringify(transactionData));
      router.push(`/transaction-confirm?data=${encodedData}`);
      
    } catch (err: any) {
      setError(err.message);
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
            title="Para İşlemleri"
            subtext="Para yatırma, çekme ve transfer işlemlerinizi gerçekleştirin"
          />
        </header>

        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">İşlem yapabilmek için önce hesap açmalısınız.</p>
            <Button 
              onClick={() => router.push('/my-banks')}
              className="mt-4 bg-bankGradient text-white"
            >
              Hesap Aç
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Account Selection & Transaction Type */}
            <div className="lg:col-span-1 space-y-6">
              {/* Account Selection Card */}
              <div className="bg-white rounded-xl shadow-chart border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-25 rounded-lg flex items-center justify-center">
                    <img src="/icons/connect-bank.svg" alt="Account" className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-black-1">Hesap Seçimi</h3>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    İşlem Yapılacak Hesap
                  </label>
                  <select
                    value={selectedAccountId || ''}
                    onChange={(e) => setSelectedAccountId(parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bankGradient focus:border-bankGradient transition-colors"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.iban} - {account.balance.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: getCurrencyTypeLabel(account.currencyType)
                        })}
                      </option>
                    ))}
                  </select>
                  
                  {selectedAccount && (
                    <div className="mt-3 p-3 bg-blue-25 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Mevcut Bakiye</span>
                        <span className="text-base font-semibold text-gray-900">
                          {selectedAccount.balance.toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: getCurrencyTypeLabel(selectedAccount.currencyType)
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Type Selection Card */}
              <div className="bg-white rounded-xl shadow-chart border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-25 rounded-lg flex items-center justify-center">
                    <img src="/icons/transaction.svg" alt="Transaction" className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-black-1">İşlem Türü</h3>
                </div>
                
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setTransactionType('deposit')}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                      transactionType === 'deposit'
                        ? 'border-blue-600 bg-blue-25 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-25'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      transactionType === 'deposit' ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      <img src="/icons/deposit.png" alt="Deposit" className={`w-6 h-6 ${transactionType === 'deposit' ? 'filter brightness-0 invert' : ''}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Para Yatırma</div>
                      <div className="text-sm opacity-75">Hesabınıza para ekleyin</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransactionType('withdraw')}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                      transactionType === 'withdraw'
                        ? 'border-blue-500 bg-blue-25 text-blue-600'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-25'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      transactionType === 'withdraw' ? 'bg-blue-500' : 'bg-gray-100'
                    }`}>
                      <img src="/icons/withdraw.png" alt="Withdraw" className={`w-6 h-6 ${transactionType === 'withdraw' ? 'filter brightness-0 invert' : ''}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Para Çekme</div>
                      <div className="text-sm opacity-75">Hesabınızdan para çekin</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransactionType('transfer')}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                      transactionType === 'transfer'
                        ? 'border-bankGradient bg-blue-25 text-bankGradient'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-bankGradient hover:bg-blue-25'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      transactionType === 'transfer' ? 'bg-bankGradient' : 'bg-gray-100'
                    }`}>
                      <img src="/icons/transfer.png" alt="Transfer" className={`w-6 h-6 ${transactionType === 'transfer' ? 'filter brightness-0 invert' : ''}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Transfer</div>
                      <div className="text-sm opacity-75">Başka hesaba para gönderin</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Transaction Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-chart border border-gray-200 p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-black-1">İşlem Detayları</h3>
                </div>

                {/* Transfer Target Account */}
                {transactionType === 'transfer' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Hedef IBAN
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={targetIban}
                        onChange={(e) => setTargetIban(e.target.value)}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bankGradient focus:border-bankGradient transition-colors text-lg"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                      <img src="/icons/arrow-right.svg" alt="Info" className="w-4 h-4" />
                      Para göndermek istediğiniz hesabın IBAN numarasını girin
                    </p>
                  </div>
                )}

                {/* Transaction Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tutar {selectedAccount && `(${getCurrencyTypeLabel(selectedAccount.currencyType)})`}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bankGradient focus:border-bankGradient transition-colors text-lg"
                        required
                      />
                      {selectedAccount && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-sm font-medium text-gray-500">
                            {getCurrencyTypeLabel(selectedAccount.currencyType)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Açıklama
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="İşlem açıklaması girin (opsiyonel)"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bankGradient focus:border-bankGradient transition-colors resize-none"
                      rows={3}
                    />
                  </div>

                  {error && (
                    <div className="bg-pink-25 border border-pink-100 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <img src="/icons/arrow-down.svg" alt="Error" className="w-4 h-4 text-pink-600" />
                        <span className="text-pink-700 font-medium">Hata</span>
                      </div>
                      <p className="text-pink-600 text-sm mt-1">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="bg-success-25 border border-success-100 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <img src="/icons/arrow-up.svg" alt="Success" className="w-4 h-4 text-success-600" />
                        <span className="text-success-700 font-medium">Başarılı</span>
                      </div>
                      <p className="text-success-600 text-sm mt-1">{success}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-bank-gradient hover:bg-bankGradient text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <img src="/icons/loader.svg" alt="Loading" className="w-4 h-4 animate-spin" />
                        İşleniyor...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        {transactionType === 'deposit' ? 'Para Yatır' :
                         transactionType === 'withdraw' ? 'Para Çek' : 'Transfer Yap'}
                      </div>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PaymentTransfer;