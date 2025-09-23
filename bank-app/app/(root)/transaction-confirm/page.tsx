'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiService } from '@/lib/api';
import HeaderBox from '@/components/HeaderBox';

interface TransactionData {
  transactionType: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  description: string;
  selectedAccountId: number;
  targetIban?: string;
  targetAccountId?: number;
}

export default function TransactionConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [targetAccount, setTargetAccount] = useState<any>(null);

  useEffect(() => {
    // URL'den transaction verilerini al
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        setTransactionData(parsedData);
        loadAccountDetails(parsedData);
      } catch (err) {
        setError('Geçersiz işlem verisi');
      }
    } else {
      setError('İşlem verisi bulunamadı');
    }
  }, [searchParams]);

  const loadAccountDetails = async (data: TransactionData) => {
    try {
      // Seçili hesap bilgilerini al
      const accounts = await apiService.getMyAccounts();
      const account = accounts.find(acc => acc.accountId === data.selectedAccountId);
      setSelectedAccount(account);

      // Transfer işlemi ise hedef hesap bilgilerini al
      if (data.transactionType === 'transfer' && data.targetIban) {
        try {
          const target = await apiService.getAccountByIban(data.targetIban);
          setTargetAccount(target);
        } catch (err) {
          setError('Hedef hesap bulunamadı');
        }
      }
    } catch (err) {
      setError('Hesap bilgileri yüklenemedi');
    }
  };

  const handleConfirm = async () => {
    if (!transactionData || !selectedAccount) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (transactionData.transactionType === 'deposit') {
        result = await apiService.deposit({
          AccountId: transactionData.selectedAccountId,
          Amount: transactionData.amount,
          Description: transactionData.description
        });
      } else if (transactionData.transactionType === 'withdraw') {
        result = await apiService.withdraw({
          AccountId: transactionData.selectedAccountId,
          Amount: transactionData.amount,
          Description: transactionData.description
        });
      } else if (transactionData.transactionType === 'transfer' && transactionData.targetAccountId) {
        result = await apiService.transfer({
          FromAccountId: transactionData.selectedAccountId,
          ToAccountId: transactionData.targetAccountId,
          Amount: transactionData.amount,
          Description: transactionData.description
        });
      }

      // Başarılı işlem sonrası başarı sayfasına yönlendir
      const successParams = new URLSearchParams({
        type: transactionData.transactionType,
        amount: transactionData.amount.toString(),
        description: transactionData.description || '',
        accountId: transactionData.selectedAccountId.toString()
      });
      
      if (transactionData.transactionType === 'transfer' && transactionData.targetAccountId) {
        successParams.set('targetAccountId', transactionData.targetAccountId.toString());
      }
      
      router.push(`/transaction-success?${successParams.toString()}`);
    } catch (err: any) {
      setError(err.message || 'İşlem gerçekleştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const getCurrencyTypeLabel = (currencyType: number) => {
    switch (currencyType) {
      case 0: return 'TRY';
      case 1: return 'USD';
      case 2: return 'EUR';
      default: return 'TRY';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Para Yatırma';
      case 'withdraw': return 'Para Çekme';
      case 'transfer': return 'Transfer';
      default: return type;
    }
  };

  const calculateFee = () => {
    if (!transactionData) return 0;
    return (transactionData.transactionType === 'withdraw' || transactionData.transactionType === 'transfer') 
      ? transactionData.amount * 0.005 
      : 0;
  };

  const calculateTotal = () => {
    if (!transactionData) return 0;
    if (transactionData.transactionType === 'withdraw' || transactionData.transactionType === 'transfer') {
      return transactionData.amount + calculateFee();
    }
    return transactionData.amount;
  };

  if (error && !transactionData) {
    return (
      <section className="flex w-full flex-row max-xl:max-h-screen max-xl:overflow-y-scroll">
        <div className="flex w-full flex-1 flex-col gap-8 px-5 sm:px-8 py-7 lg:py-12 xl:max-h-screen xl:overflow-y-scroll">
          <header>
            <HeaderBox 
              type="greeting"
              title="İşlem Onayı"
              subtext="İşlem detaylarınızı kontrol edin"
              user={user?.name || 'Guest'}
            />
          </header>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Hata</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/payment-transfer')}
                className="bg-bankGradient text-white px-6 py-3 rounded-lg hover:bg-bankGradient/90 transition-colors"
              >
                Geri Dön
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!transactionData || !selectedAccount) {
    return (
      <section className="flex w-full flex-row max-xl:max-h-screen max-xl:overflow-y-scroll">
        <div className="flex w-full flex-1 flex-col gap-8 px-5 sm:px-8 py-7 lg:py-12 xl:max-h-screen xl:overflow-y-scroll">
          <header>
            <HeaderBox 
              type="greeting"
              title="İşlem Onayı"
              subtext="İşlem detaylarınızı kontrol edin"
              user={user?.name || 'Guest'}
            />
          </header>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bankGradient mx-auto mb-4"></div>
              <p className="text-gray-600">İşlem bilgileri yükleniyor...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-row max-xl:max-h-screen max-xl:overflow-y-scroll">
      <div className="flex w-full flex-1 flex-col gap-8 px-5 sm:px-8 py-7 lg:py-12 xl:max-h-screen xl:overflow-y-scroll">
        <header>
          <HeaderBox 
            type="greeting"
            title="İşlem Onayı"
            subtext="İşlem detaylarınızı kontrol edin ve onaylayın"
            user={user?.name || 'Guest'}
          />
        </header>

        <div className="max-w-2xl mx-auto w-full">
          {/* İşlem Türü */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">İşlem Türü</h3>
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium text-gray-900">
                {getTransactionTypeLabel(transactionData.transactionType)}
              </span>
            </div>
          </div>

          {/* Hesap Bilgileri */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hesap Bilgileri</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Hesap:</span>
                <span className="font-medium">{selectedAccount.iban}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mevcut Bakiye:</span>
                <span className="font-medium">
                  {selectedAccount.balance.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: getCurrencyTypeLabel(selectedAccount.currencyType)
                  })}
                </span>
              </div>
              {targetAccount && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hedef Hesap:</span>
                    <span className="font-medium">{targetAccount.iban}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hedef Hesap Sahibi:</span>
                    <span className="font-medium">{targetAccount.userName}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* İşlem Detayları */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">İşlem Detayları</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tutar:</span>
                <span className="font-medium">
                  {transactionData.amount.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: getCurrencyTypeLabel(selectedAccount.currencyType)
                  })}
                </span>
              </div>
              {calculateFee() > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Komisyon (%0.5):</span>
                  <span className="font-medium text-red-600">
                    {calculateFee().toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: getCurrencyTypeLabel(selectedAccount.currencyType)
                    })}
                  </span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    {transactionData.transactionType === 'deposit' ? 'Yatırılacak Tutar:' : 'Toplam Tutar:'}
                  </span>
                  <span className="text-lg font-bold text-bankGradient">
                    {calculateTotal().toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: getCurrencyTypeLabel(selectedAccount.currencyType)
                    })}
                  </span>
                </div>
              </div>
              {transactionData.description && (
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Açıklama:</span>
                    <span className="font-medium text-right max-w-xs">{transactionData.description}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hata Mesajı */}
          {error && (
            <div className="bg-pink-25 border border-pink-100 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="text-pink-600">⚠️</div>
                <p className="text-pink-700">{error}</p>
              </div>
            </div>
          )}

          {/* Onay Butonları */}
          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              İptal Et
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-bankGradient text-white px-6 py-4 rounded-lg hover:bg-bankGradient/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  İşlem Yapılıyor...
                </>
              ) : (
                'İşlemi Onayla'
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
