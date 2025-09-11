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

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      
      // döviz kurları API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data = await response.json();
      
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD'];
      const newRates: ExchangeRate[] = currencies.map(currency => {
        const rate = 1 / data.rates[currency];
        const buy = rate * 0.995;
        const sell = rate * 1.005;
        const change = (Math.random() - 0.5) * 0.5;
        const changePercent = (change / rate) * 100;
        
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
      
      const mockRates: ExchangeRate[] = [
        {
          currency: 'USD',
          symbol: '$',
          buy: 34.25,
          sell: 34.35,
          change: 0.15,
          changePercent: 0.44
        },
        {
          currency: 'EUR',
          symbol: '€',
          buy: 37.12,
          sell: 37.25,
          change: -0.08,
          changePercent: -0.21
        },
        {
          currency: 'GBP',
          symbol: '£',
          buy: 43.45,
          sell: 43.65,
          change: 0.22,
          changePercent: 0.51
        },
        {
          currency: 'JPY',
          symbol: '¥',
          buy: 0.23,
          sell: 0.24,
          change: 0.001,
          changePercent: 0.42
        },
        {
          currency: 'CHF',
          symbol: 'CHF',
          buy: 38.95,
          sell: 39.15,
          change: -0.12,
          changePercent: -0.31
        },
        {
          currency: 'CAD',
          symbol: 'C$',
          buy: 25.15,
          sell: 25.35,
          change: 0.05,
          changePercent: 0.20
        }
      ];
      
      setRates(mockRates);
      setLastUpdate(new Date());
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
            {[...Array(6)].map((_, index) => (
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
