'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { Button } from '@/components/ui/button';
import HeaderBox from '@/components/HeaderBox';
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function ExchangeTradingPage() {
  const { isAuthenticated } = useAuth();
  const { accounts, getCurrencyTypeLabel, getCurrencySymbol } = useAccounts();
  const router = useRouter();

  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const [tryAccountId, setTryAccountId] = useState<number>(0);
  const [exchangeAccountId, setExchangeAccountId] = useState<number>(0);
  const [amount, setAmount] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [currentRate, setCurrentRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rates, setRates] = useState<Array<{
    currency: string;
    symbol: string;
    buy: number;
    sell: number;
    change: number;
    changePercent: number;
  }>>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  // Döviz kurlarını çek
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        // Değişim yüzdeleri ile birlikte kurları al
        const response = await fetch('http://localhost:5020/api/Admin/exchange-rates-with-change');
        if (response.ok) {
          const data = await response.json();
          if (data.rates) {
            const currencies = ['USD', 'EUR', 'GBP'];
            const newRates = currencies.map(currency => {
              const currentRate = data.rates[currency];
              const spread = 0.005; // %0.5 spread
              const buy = currentRate * (1 - spread);
              const sell = currentRate * (1 + spread);
              const changePercent = data.rates[`${currency}_CHANGE`] || 0;
              const change = (currentRate * changePercent) / 100;
              
              return {
                currency,
                symbol: getCurrencySymbol(currency),
                buy: Number(buy.toFixed(2)),
                sell: Number(sell.toFixed(2)),
                change: Number(change.toFixed(3)),
                changePercent: Number(changePercent.toFixed(2))
              };
            });
            setRates(newRates);
            setLastUpdate(new Date());
          }
        }
      } catch (error) {
        console.error('Döviz kurları alınamadı:', error);
      }
    };

    fetchExchangeRates();
  }, [getCurrencySymbol]);

  // TRY hesaplarını filtrele
  const tryAccounts = accounts.filter(account => account.currencyType === 0);
  
  // Döviz hesaplarını filtrele (TRY dışındaki)
  const exchangeAccounts = accounts.filter(account => account.currencyType !== 0);

  // İlk TRY hesabını seç
  useEffect(() => {
    if (tryAccounts.length > 0 && tryAccountId === 0) {
      setTryAccountId(tryAccounts[0].id);
    }
  }, [tryAccounts, tryAccountId]);

  // İlk döviz hesabını seç
  useEffect(() => {
    if (exchangeAccounts.length > 0 && exchangeAccountId === 0) {
      setExchangeAccountId(exchangeAccounts[0].id);
    }
  }, [exchangeAccounts, exchangeAccountId]);

  // Seçili hesapları al
  const selectedTryAccount = tryAccounts.find(account => account.id === tryAccountId);
  const selectedExchangeAccount = exchangeAccounts.find(account => account.id === exchangeAccountId);

  // Güncel kur hesapla
  useEffect(() => {
    if (selectedExchangeAccount && amount) {
      fetchCurrentRate();
    }
  }, [selectedExchangeAccount, amount, transactionType]);

  const fetchCurrentRate = async () => {
    if (!selectedExchangeAccount || !amount) return;

    try {
      const response = await fetch('http://localhost:5020/api/Admin/exchange-service');
      const data = await response.json();
      
      if (data.rates) {
        const currency = getCurrencyTypeLabel(selectedExchangeAccount.currencyType);
        const baseRate = data.rates[currency] || 1;
        
        // Spread uygula (%0.5)
        const spread = 0.005;
        let rate;
        
        if (transactionType === 'buy') {
          // Döviz alırken: TRY -> Döviz (satış kuru kullanılır - yüksek)
          rate = baseRate * (1 + spread);
        } else {
          // Döviz satarken: Döviz -> TRY (alış kuru kullanılır - düşük)
          rate = baseRate * (1 - spread);
        }
        
        setCurrentRate(rate);
        
        const amountNum = parseFloat(amount);
        if (transactionType === 'buy') {
          // TRY miktarını döviz miktarına çevir
          setCalculatedAmount(amountNum / rate);
        } else {
          // Döviz miktarını TRY miktarına çevir
          setCalculatedAmount(amountNum * rate);
        }
      }
    } catch (error) {
      console.error('Kur alınamadı:', error);
      setError('Güncel kur alınamadı');
    }
  };

  const handleContinue = () => {
    if (!selectedTryAccount || !selectedExchangeAccount || !amount) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    const transactionData = {
      transactionType,
      tryAccountId,
      exchangeAccountId,
      amount: parseFloat(amount),
      calculatedAmount,
      currentRate,
      tryAccount: selectedTryAccount,
      exchangeAccount: selectedExchangeAccount
    };

    const encodedData = encodeURIComponent(JSON.stringify(transactionData));
    router.push(`/exchange-confirm?data=${encodedData}`);
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!isAuthenticated) {
    return null;
  }

  // TRY hesabı yoksa hesap açmaya yönlendir
  if (tryAccounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBox />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              TRY Hesabı Bulunamadı
            </h2>
            <p className="text-gray-600 mb-6">
              Döviz alım satımı yapabilmek için önce bir TRY hesabı açmalısınız.
            </p>
            <Button
              onClick={() => router.push('/my-banks')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Hesap Aç
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Döviz hesabı yoksa hesap açmaya yönlendir
  if (exchangeAccounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBox />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Döviz Hesabı Bulunamadı
            </h2>
            <p className="text-gray-600 mb-6">
              Döviz alım satımı yapabilmek için önce bir döviz hesabı açmalısınız.
            </p>
            <Button
              onClick={() => router.push('/my-banks')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Hesap Aç
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="flex w-full flex-row max-xl:max-h-screen max-xl:overflow-y-scroll">
      <div className="flex w-full flex-1 flex-col gap-8 px-5 sm:px-8 py-7 lg:py-12 xl:max-h-screen xl:overflow-y-scroll">
        <HeaderBox />
        {/* Başlık ve Açıklama */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={handleGoBack}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Döviz Alım Satım</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Güncel döviz kurları ile güvenli döviz alım satım işlemlerinizi gerçekleştirin.
          </p>
        </div>


        <div>
          {/* İşlem Türü ve Hesap Seçimi */}
          <div className="space-y-6">
            {/* İşlem Türü Seçimi */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <div className="flex items-center justify-center">
                <div className="inline-flex gap-3 sm:gap-4">
                  <button
                    onClick={() => setTransactionType('buy')}
                    className={`flex flex-col items-start sm:items-center sm:flex-row gap-1.5 sm:gap-3 px-5 py-3.5 rounded-xl border transition-all ${
                      transactionType === 'buy'
                        ? 'border-green-500 bg-green-50 text-green-700 shadow'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <TrendingUp className={`w-6 h-6 ${transactionType === 'buy' ? 'text-green-600' : 'text-gray-600'}`} />
                    <div className="text-left sm:text-center">
                      <div className="text-base font-semibold">Döviz Al</div>
                      <div className="text-[12px] text-gray-500 leading-none">TRY → Döviz</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setTransactionType('sell')}
                    className={`flex flex-col items-start sm:items-center sm:flex-row gap-1.5 sm:gap-3 px-5 py-3.5 rounded-xl border transition-all ${
                      transactionType === 'sell'
                        ? 'border-red-500 bg-red-50 text-red-700 shadow'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <TrendingDown className={`w-6 h-6 ${transactionType === 'sell' ? 'text-red-600' : 'text-gray-600'}`} />
                    <div className="text-left sm:text-center">
                      <div className="text-base font-semibold">Döviz Sat</div>
                      <div className="text-[12px] text-gray-500 leading-none">Döviz → TRY</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Güncel Döviz Kurları */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Güncel Döviz Kurları</h3>
              <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rates.map((rate) => (
                  <div key={rate.currency} className="flex items-center justify-between p-5 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow w-full h-full">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold">
                        {rate.currency === 'USD' ? '$' : 
                         rate.currency === 'EUR' ? '€' : 
                         rate.currency === 'GBP' ? '£' : '₺'}
                      </span>
                      <div>
                        <span className="text-base font-semibold text-gray-900">{rate.currency}</span>
                        <div className="text-xs text-gray-600">
                          {rate.currency === 'USD' ? 'Amerikan Doları' : 
                           rate.currency === 'EUR' ? 'Euro' : 
                           rate.currency === 'GBP' ? 'İngiliz Sterlini' : 'Türk Lirası'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-gray-900">
                        {rate.buy.toFixed(2)} / {rate.sell.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">Alış / Satış</div>
                      <div className="flex items-center justify-end gap-1">
                        <svg className={`w-3 h-3 ${rate.change >= 0 ? 'text-green-600' : 'text-red-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={rate.change >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
                        </svg>
                        <span className={`text-xs font-medium ${rate.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rate.change >= 0 ? '+' : ''}{rate.change.toFixed(2)}
                        </span>
                        <span className={`text-xs ${rate.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({rate.change >= 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                   </div>
                 ))}
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Son güncelleme: {lastUpdate ? lastUpdate.toLocaleTimeString('tr-TR') : 'Yükleniyor...'}
              </p>
            </div>

            {/* Hesap Seçimi */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Hesap Seçimi</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                {/* İlk Hesap - Alışta TRY, Satışta Döviz */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-800">
                    {transactionType === 'buy' ? 'Ödeme Hesabı (TRY)' : 'Ödeme Hesabı (Döviz)'}
                  </h3>
                  <select
                    value={transactionType === 'buy' ? tryAccountId : exchangeAccountId}
                    onChange={(e) => {
                      if (transactionType === 'buy') {
                        setTryAccountId(parseInt(e.target.value));
                      } else {
                        setExchangeAccountId(parseInt(e.target.value));
                      }
                    }}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {(transactionType === 'buy' ? tryAccounts : exchangeAccounts).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.iban} - {account.balance.toLocaleString('tr-TR')} {getCurrencyTypeLabel(account.currencyType)}
                      </option>
                    ))}
                  </select>
                  {transactionType === 'buy' ? selectedTryAccount && (
                    <p className="text-sm text-gray-600">
                      Bakiye: {selectedTryAccount.balance.toLocaleString('tr-TR')} TRY
                    </p>
                  ) : selectedExchangeAccount && (
                    <p className="text-sm text-gray-600">
                      Bakiye: {selectedExchangeAccount.balance.toLocaleString('tr-TR')} {getCurrencyTypeLabel(selectedExchangeAccount.currencyType)}
                    </p>
                  )}
                </div>

                {/* İkinci Hesap - Alışta Döviz, Satışta TRY */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-800">
                    {transactionType === 'buy' ? 'Alacak Hesabı (Döviz)' : 'Alacak Hesabı (TRY)'}
                  </h3>
                  <select
                    value={transactionType === 'buy' ? exchangeAccountId : tryAccountId}
                    onChange={(e) => {
                      if (transactionType === 'buy') {
                        setExchangeAccountId(parseInt(e.target.value));
                      } else {
                        setTryAccountId(parseInt(e.target.value));
                      }
                    }}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {(transactionType === 'buy' ? exchangeAccounts : tryAccounts).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.iban} - {account.balance.toLocaleString('tr-TR')} {getCurrencyTypeLabel(account.currencyType)}
                      </option>
                    ))}
                  </select>
                  {transactionType === 'buy' ? selectedExchangeAccount && (
                    <p className="text-sm text-gray-600">
                      Bakiye: {selectedExchangeAccount.balance.toLocaleString('tr-TR')} {getCurrencyTypeLabel(selectedExchangeAccount.currencyType)}
                    </p>
                  ) : selectedTryAccount && (
                    <p className="text-sm text-gray-600">
                      Bakiye: {selectedTryAccount.balance.toLocaleString('tr-TR')} TRY
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tutar Girişi */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tutar Girişi</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {transactionType === 'buy' ? 'TRY Tutarı' : `${getCurrencyTypeLabel(selectedExchangeAccount?.currencyType || 1)} Tutarı`}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    step="0.01"
                    min="0"
                  />
                  <p className="text-xs text-gray-500">
                    {transactionType === 'buy' ? 'Bu tutar TRY hesabınızdan çekilecek' : 'Bu tutar döviz hesabınızdan çekilecek'}
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {transactionType === 'buy' ? `${getCurrencyTypeLabel(selectedExchangeAccount?.currencyType || 1)} Tutarı` : 'TRY Tutarı'}
                  </label>
                  <div className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-lg font-semibold">
                    {calculatedAmount > 0 ? calculatedAmount.toFixed(2) : '0.00'}
                  </div>
                  <p className="text-xs text-gray-500">
                    {transactionType === 'buy' ? 'Bu tutar döviz hesabınıza yatırılacak' : 'Bu tutar TRY hesabınıza yatırılacak'}
                  </p>
                </div>
              </div>
              
              {/* Güncel Kur */}
              {currentRate > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 text-center">
                    Güncel Kur: 1 {getCurrencyTypeLabel(selectedExchangeAccount?.currencyType || 1)} = {currentRate.toFixed(4)} TRY
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hata Mesajı ve Devam Butonu */}
        <div className="mt-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Devam Butonu */}
          <div className="flex justify-center">
            <Button
              onClick={handleContinue}
              disabled={!tryAccountId || !exchangeAccountId || !amount || parseFloat(amount) <= 0 || loading}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  İşleniyor...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Devam Et</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
