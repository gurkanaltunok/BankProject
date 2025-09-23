'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import HeaderBox from '@/components/HeaderBox';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';

export default function TransactionSuccessPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactionData, setTransactionData] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    // URL'den işlem verilerini al
    const transactionType = searchParams.get('type');
    const amount = searchParams.get('amount');
    const description = searchParams.get('description');
    const accountId = searchParams.get('accountId');
    const targetAccountId = searchParams.get('targetAccountId');

    if (transactionType && amount) {
      setTransactionData({
        type: transactionType,
        amount: parseFloat(amount),
        description: description || '',
        accountId: accountId ? parseInt(accountId) : null,
        targetAccountId: targetAccountId ? parseInt(targetAccountId) : null
      });
    }
  }, [isAuthenticated, router, searchParams]);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Para Yatırma';
      case 'withdraw': return 'Para Çekme';
      case 'transfer': return 'Transfer';
      default: return type;
    }
  };

  const getSuccessMessage = (type: string) => {
    switch (type) {
      case 'deposit': return 'Para başarıyla hesabınıza yatırıldı';
      case 'withdraw': return 'Para başarıyla hesabınızdan çekildi';
      case 'transfer': return 'Transfer başarıyla gerçekleştirildi';
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
                  <span className="text-gray-600">Tutar:</span>
                  <span className="font-medium text-lg">
                    {transactionData.amount.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    })}
                  </span>
                </div>
                
                {transactionData.description && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Açıklama:</span>
                    <span className="font-medium text-right max-w-xs">
                      {transactionData.description}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarih:</span>
                  <span className="font-medium">
                    {new Date().toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Açıklama */}
          <p className="text-gray-600 mb-8">
            İşleminiz başarıyla tamamlanmıştır. İşlem detaylarınızı hesap geçmişinizden görüntüleyebilirsiniz.
          </p>

          {/* Butonlar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGoToAccounts}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Home className="w-4 h-4" />
              Hesaplarım
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
