'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { apiService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import HeaderBox from '@/components/HeaderBox';
import TransactionConfirmModal from '@/components/TransactionConfirmModal';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);

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

      if (!description.trim()) {
        throw new Error('Açıklama alanı zorunludur');
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
      }

      // Onay modal'ı için veri hazırla
      const fee = (transactionType === 'withdraw' || transactionType === 'transfer') ? amountValue * 0.02 : 0;
      
      setPendingTransaction({
        type: transactionType,
        amount: amountValue,
        description,
        accountIban: selectedAccount?.iban,
        targetIban: targetIban,
        currentBalance: selectedAccount?.balance || 0,
        fee,
        currencyType: selectedAccount?.currencyType || 0,
        targetAccountId
      });
      
      setShowConfirmModal(true);
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmTransaction = async () => {
    if (!pendingTransaction) return;
    
    setLoading(true);
    setShowConfirmModal(false);
    
    try {
      let transaction;
      
      switch (pendingTransaction.type) {
        case 'deposit':
          transaction = await deposit(selectedAccountId, pendingTransaction.amount, pendingTransaction.description);
          setSuccess('Para yatırma işlemi başarıyla tamamlandı');
          break;
        case 'withdraw':
          transaction = await withdraw(selectedAccountId, pendingTransaction.amount, pendingTransaction.description);
          setSuccess('Para çekme işlemi başarıyla tamamlandı');
          break;
        case 'transfer':
          transaction = await transfer(selectedAccountId, pendingTransaction.targetAccountId, pendingTransaction.amount, pendingTransaction.description);
          setSuccess('Transfer işlemi başarıyla tamamlandı');
          break;
      }

      // Reset form
      setAmount('');
      setDescription('');
      setTargetIban('');
      setPendingTransaction(null);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <div className="space-y-6">
            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İşlem Yapılacak Hesap
              </label>
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-bankGradient"
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
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    Mevcut Bakiye: {selectedAccount.balance.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: getCurrencyTypeLabel(selectedAccount.currencyType)
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Transaction Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İşlem Türü
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="transactionType"
                    value="deposit"
                    checked={transactionType === 'deposit'}
                    onChange={(e) => setTransactionType(e.target.value as any)}
                    className="mr-2"
                  />
                  Para Yatırma
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="transactionType"
                    value="withdraw"
                    checked={transactionType === 'withdraw'}
                    onChange={(e) => setTransactionType(e.target.value as any)}
                    className="mr-2"
                  />
                  Para Çekme
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="transactionType"
                    value="transfer"
                    checked={transactionType === 'transfer'}
                    onChange={(e) => setTransactionType(e.target.value as any)}
                    className="mr-2"
                  />
                  Transfer
                </label>
              </div>
            </div>

            {/* Transfer Target Account */}
            {transactionType === 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hedef IBAN
                </label>
                <input
                  type="text"
                  value={targetIban}
                  onChange={(e) => setTargetIban(e.target.value)}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-bankGradient"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Para göndermek istediğiniz hesabın IBAN numarasını girin
                </p>
              </div>
            )}

            {/* Transaction Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tutar {selectedAccount && `(${getCurrencyTypeLabel(selectedAccount.currencyType)})`}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-bankGradient"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="İşlem açıklaması girin"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-bankGradient"
                  rows={3}
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-500 text-sm bg-green-50 p-3 rounded-md">
                  {success}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-bankGradient text-white"
              >
                {loading ? 'İşleniyor...' : 
                  transactionType === 'deposit' ? 'Para Yatır' :
                  transactionType === 'withdraw' ? 'Para Çek' : 'Transfer Yap'
                }
              </Button>
            </form>
          </div>
        )}
      </div>
      
      {/* Transaction Confirmation Modal */}
      <TransactionConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingTransaction(null);
        }}
        onConfirm={handleConfirmTransaction}
        transactionType={pendingTransaction?.type || 'deposit'}
        transactionData={pendingTransaction || {}}
        getCurrencySymbol={getCurrencySymbol}
      />
    </section>
  );
};

export default PaymentTransfer;