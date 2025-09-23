'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { Button } from '@/components/ui/button';
import HeaderBox from '@/components/HeaderBox';
import { ArrowLeft, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { apiService } from '@/lib/api';

export default function ExchangeConfirmPage() {
  const { isAuthenticated } = useAuth();
  const { getCurrencyTypeLabel, getCurrencySymbol } = useAccounts();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [transactionData, setTransactionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(dataParam));
        setTransactionData(decodedData);
      } catch (error) {
        setError('İşlem verileri okunamadı');
      }
    } else {
      setError('İşlem verileri bulunamadı');
    }
  }, [isAuthenticated, router, searchParams]);

  const handleConfirm = async () => {
    if (!transactionData) return;

    setLoading(true);
    setError('');

    try {
      let result;
      
      if (transactionData.transactionType === 'buy') {
        result = await apiService.exchangeBuy({
          FromAccountId: transactionData.tryAccountId,
          ToAccountId: transactionData.exchangeAccountId,
          AmountTRY: transactionData.amount,
          AmountForeign: transactionData.calculatedAmount,
          Rate: transactionData.currentRate,
          Description: transactionData.description || 'Döviz Alış İşlemi'
        });
      } else {
        result = await apiService.exchangeSell({
          FromAccountId: transactionData.exchangeAccountId,
          ToAccountId: transactionData.tryAccountId,
          AmountForeign: transactionData.amount,
          AmountTRY: transactionData.calculatedAmount,
          Rate: transactionData.currentRate,
          Description: transactionData.description || 'Döviz Satış İşlemi'
        });
      }
      
      // Başarı sayfasına yönlendir
      const successParams = new URLSearchParams({
        type: transactionData.transactionType,
        amount: transactionData.amount.toString(),
        calculatedAmount: transactionData.calculatedAmount.toString(),
        rate: transactionData.currentRate.toString(),
        tryAccountId: transactionData.tryAccountId.toString(),
        exchangeAccountId: transactionData.exchangeAccountId.toString(),
        fromCurrency: transactionData.transactionType === 'buy' ? 'TRY' : getCurrencyTypeLabel(transactionData.exchangeAccount.currencyType),
        toCurrency: transactionData.transactionType === 'buy' ? getCurrencyTypeLabel(transactionData.exchangeAccount.currencyType) : 'TRY'
      });
      
      router.push(`/exchange-success?${successParams.toString()}`);
    } catch (err: any) {
      setError(err.message || 'İşlem gerçekleştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!transactionData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBox />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              İşlem Verileri Bulunamadı
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => router.push('/exchange-trading')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Döviz Alım Satım
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getTransactionTypeLabel = (type: string) => {
    return type === 'buy' ? 'Döviz Al' : 'Döviz Sat';
  };

  const getTransactionDescription = (type: string) => {
    if (type === 'buy') {
      return `${transactionData.amount} TRY ile ${transactionData.calculatedAmount.toFixed(2)} ${getCurrencyTypeLabel(transactionData.exchangeAccount.currencyType)} alacaksınız`;
    } else {
      return `${transactionData.amount} ${getCurrencyTypeLabel(transactionData.exchangeAccount.currencyType)} ile ${transactionData.calculatedAmount.toFixed(2)} TRY alacaksınız`;
    }
  };

  const calculateCommission = (amount: number) => {
    const commission = amount * 0.005; // %0.5 komisyon
    return commission;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBox />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Başlık */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">İşlem Onayı</h1>
        </div>

        {/* İşlem Detayları */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {getTransactionTypeLabel(transactionData.transactionType)}
            </h2>
            <p className="text-gray-600">
              {getTransactionDescription(transactionData.transactionType)}
            </p>
          </div>

          {/* İşlem Bilgileri */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">İşlem Türü:</span>
              <span className="font-medium">{getTransactionTypeLabel(transactionData.transactionType)}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Güncel Kur:</span>
              <span className="font-medium">
                1 {getCurrencyTypeLabel(transactionData.exchangeAccount.currencyType)} = {transactionData.currentRate.toFixed(4)} TRY
              </span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">
                {transactionData.transactionType === 'buy' ? 'Ödeme Hesabı:' : 'Alacak Hesabı:'}
              </span>
              <span className="font-medium">
                {transactionData.tryAccount.iban} ({transactionData.tryAccount.balance.toLocaleString('tr-TR')} TRY)
              </span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">
                {transactionData.transactionType === 'buy' ? 'Alacak Hesabı:' : 'Ödeme Hesabı:'}
              </span>
              <span className="font-medium">
                {transactionData.exchangeAccount.iban} ({transactionData.exchangeAccount.balance.toLocaleString('tr-TR')} {getCurrencyTypeLabel(transactionData.exchangeAccount.currencyType)})
              </span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">
                {transactionData.transactionType === 'buy' ? 'TRy Tutarı:' : `${getCurrencyTypeLabel(transactionData.exchangeAccount.currencyType)} Tutarı:`}
              </span>
              <span className="font-medium text-lg">
                {transactionData.amount.toLocaleString('tr-TR')} {transactionData.transactionType === 'buy' ? 'TRY' : getCurrencyTypeLabel(transactionData.exchangeAccount.currencyType)}
              </span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">
                {transactionData.transactionType === 'buy' ? `${getCurrencyTypeLabel(transactionData.exchangeAccount.currencyType)} Tutarı:` : 'TRY Tutarı:'}
              </span>
              <span className="font-medium text-lg text-green-600">
                {transactionData.calculatedAmount.toFixed(2)} {transactionData.transactionType === 'buy' ? getCurrencyTypeLabel(transactionData.exchangeAccount.currencyType) : 'TRY'}
              </span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-200 bg-orange-50 -mx-8 px-8 py-4">
              <span className="text-gray-700 font-medium">Banka Komisyonu:</span>
              <span className="font-bold text-orange-600 text-lg">
                {calculateCommission(transactionData.amount).toFixed(2)} TRY (%0.5)
              </span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-200 bg-gray-50 -mx-8 px-8 py-4">
              <span className="text-gray-800 font-semibold">
                {transactionData.transactionType === 'buy' ? 'Toplam Ödeme:' : 'Toplam Alacak:'}
              </span>
              <span className="font-bold text-lg text-blue-600">
                {transactionData.transactionType === 'buy' 
                  ? `${(transactionData.amount + calculateCommission(transactionData.amount)).toFixed(2)} TRY`
                  : `${(transactionData.calculatedAmount - calculateCommission(transactionData.calculatedAmount)).toFixed(2)} TRY`
                }
              </span>
            </div>
            
            <div className="flex justify-between py-3">
              <span className="text-gray-600">Tarih:</span>
              <span className="font-medium">
                {new Date().toLocaleString('tr-TR')}
              </span>
            </div>
          </div>

          {/* Uyarı */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Önemli Uyarı</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Döviz kurları anlık olarak değişebilir. İşlem onaylandıktan sonra değişiklik yapılamaz.
                </p>
              </div>
            </div>
          </div>

          {/* Hata Mesajı */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Butonlar */}
          <div className="flex gap-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  İşleniyor...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Onayla
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
