'use client';

import { useEffect, useState } from 'react';

interface ExchangeRate {
  currency: string;
  symbol: string;
  buy: number;
  sell: number;
  change: number;
  changePercent: number;
}

const ExchangeRatesWidget = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previousRates, setPreviousRates] = useState<{[key: string]: number}>({});

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Backend API'mizden döviz kurlarını ve günlük değişimi çek
      const response = await fetch('http://localhost:5020/api/Test/exchange-rates-with-change');
      
      if (!response.ok) {
        throw new Error(`API Hatası: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // API'den gelen kurları kontrol et
      if (!data.rates || Object.keys(data.rates).length === 0) {
        throw new Error('Frankfurter API çalışmıyor. Kurlar alınamadı.');
      }
      
      // Backend'den gelen kurları kullan
      const currencies = ['USD', 'EUR', 'GBP'];
      const newRates: ExchangeRate[] = currencies.map(currency => {
        const currentRate = data.rates[currency];
        if (!currentRate) {
          throw new Error(`${currency} kuru alınamadı.`);
        }

        // %0.5 spread ekle (alış ve satış farkı)
        const spread = 0.005; // %0.5
        const buy = currentRate * (1 - spread); // Alış kuru (düşük)
        const sell = currentRate * (1 + spread); // Satış kuru (yüksek)

        // Backend'den gelen gerçek yüzde değişimi kullan
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
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setError(error instanceof Error ? error.message : 'Bilinmeyen hata oluştu');
      setRates([]); // Kurları temizle
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CHF': 'CHF',
      'CAD': 'C$'
    };
    return symbols[currency] || currency;
  };

  useEffect(() => {
    fetchExchangeRates();
    
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Canlı Döviz Kurları</h2>
          <button
            onClick={fetchExchangeRates}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Yenile"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        {lastUpdate && (
          <p className="text-xs text-gray-500 mt-1">
            Son güncelleme: {formatTime(lastUpdate)}
          </p>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="w-12 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    <div className="w-12 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Döviz Kurları Alınamadı</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchExchangeRates}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rates.map((rate) => (
              <div key={rate.currency} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">{rate.symbol}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{rate.currency}</p>
                    <p className="text-xs text-gray-500">Alış / Satış</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {rate.buy.toFixed(2)} / {rate.sell.toFixed(2)}
                  </p>
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs font-medium ${
                      rate.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {rate.change >= 0 ? '+' : ''}{rate.change.toFixed(2)}
                    </span>
                    <span className={`text-xs ${
                      rate.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ({rate.change >= 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ExchangeRatesWidget;
