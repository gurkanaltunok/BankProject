'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { Button } from '@/components/ui/button';
import HeaderBox from '@/components/HeaderBox';
import { CheckCircle, ArrowLeft, Home, TrendingUp, TrendingDown } from 'lucide-react';

export default function ExchangeSuccessPage() {
  const { isAuthenticated } = useAuth();
  const { getCurrencyTypeLabel } = useAccounts();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactionData, setTransactionData] = useState<any>(null);
  const [exchangeCurrency, setExchangeCurrency] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    // URL'den işlem verilerini al
    const type = searchParams.get('type');
    const amount = searchParams.get('amount');
    const calculatedAmount = searchParams.get('calculatedAmount');
    const rate = searchParams.get('rate');
    const tryAccountId = searchParams.get('tryAccountId');
    const exchangeAccountId = searchParams.get('exchangeAccountId');
    const fromCurrency = searchParams.get('fromCurrency');
    const toCurrency = searchParams.get('toCurrency');

    if (type && amount && calculatedAmount && rate) {
      setTransactionData({
        type,
        amount: parseFloat(amount),
        calculatedAmount: parseFloat(calculatedAmount),
        rate: parseFloat(rate),
        tryAccountId: tryAccountId ? parseInt(tryAccountId) : null,
        exchangeAccountId: exchangeAccountId ? parseInt(exchangeAccountId) : null,
        fromCurrency: fromCurrency || 'TRY',
        toCurrency: toCurrency || 'USD'
      });
      
      // Döviz türünü belirle
      if (type === 'buy') {
        setExchangeCurrency(toCurrency || 'USD');
      } else {
        setExchangeCurrency(fromCurrency || 'USD');
      }
    }
  }, [isAuthenticated, router, searchParams]);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'buy': return 'Döviz Alım';
      case 'sell': return 'Döviz Satım';
      default: return type;
    }
  };

  const getSuccessMessage = (type: string) => {
    switch (type) {
      case 'buy': return 'Döviz alım işlemi başarıyla tamamlandı';
      case 'sell': return 'Döviz satım işlemi başarıyla tamamlandı';
      default: return 'İşlem başarıyla tamamlandı';
    }
  };

  const handleGoToAccounts = () => {
    router.push('/my-banks');
  };

  const handleGoToHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleNewTransaction = () => {
    router.push('/exchange-trading');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBox />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Başarı İkonu */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Başlık */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            İşlem Başarılı!
          </h1>

          {/* İşlem Detayları */}
          {transactionData && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {getSuccessMessage(transactionData.type)}
              </h2>
              
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">İşlem Türü:</span>
                  <span className="font-medium">{getTransactionTypeLabel(transactionData.type)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Güncel Kur:</span>
                  <span className="font-medium">{transactionData.rate.toFixed(4)} TRY</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {transactionData.type === 'buy' ? 'Ödenen TRY:' : 'Satılan Döviz:'}
                  </span>
                  <span className="font-medium text-lg">
                    {transactionData.amount.toLocaleString('tr-TR')} {transactionData.type === 'buy' ? 'TRY' : exchangeCurrency}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {transactionData.type === 'buy' ? 'Alınan Döviz:' : 'Alınan TRY:'}
                  </span>
                  <span className="font-medium text-lg text-green-600">
                    {transactionData.calculatedAmount.toFixed(2)} {transactionData.type === 'buy' ? exchangeCurrency : 'TRY'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarih:</span>
                  <span className="font-medium">
                    {new Date().toLocaleString('tr-TR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Açıklama */}
          <p className="text-gray-600 mb-8">
            Döviz alım satım işleminiz başarıyla tamamlanmıştır. İşlem detaylarınızı hesap geçmişinizden görüntüleyebilirsiniz.
          </p>

          {/* Butonlar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGoToAccounts}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Home className="w-4 h-4" />
              Hesaplarım
            </Button>
            
            <Button
              onClick={handleNewTransaction}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {transactionData?.type === 'buy' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              Yeni İşlem
            </Button>
            
            <Button
              onClick={handleGoToHome}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ana Sayfa
            </Button>
            
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
