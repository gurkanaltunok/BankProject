import { useState, useEffect } from 'react';

interface ExchangeRate {
  currency: string;
  rate: number;
}

export const useExchangeRates = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TCMB API'si yerine sabit kurlar kullanıyoruz (gerçek uygulamada TCMB API'si kullanılmalı)
      const mockRates: ExchangeRate[] = [
        { currency: 'USD', rate: 34.50 }, // 1 USD = 34.50 TL
        { currency: 'EUR', rate: 37.20 }, // 1 EUR = 37.20 TL
        { currency: 'TRY', rate: 1.00 },  // 1 TL = 1.00 TL
      ];
      
      setRates(mockRates);
    } catch (err) {
      setError('Döviz kurları alınamadı');
      console.error('Exchange rate fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const convertToTRY = (amount: number, currencyType: number): number => {
    const currencyMap = { 0: 'TRY', 1: 'USD', 2: 'EUR' };
    const currency = currencyMap[currencyType as keyof typeof currencyMap] || 'TRY';
    
    if (currency === 'TRY') return amount;
    
    const rate = rates.find(r => r.currency === currency)?.rate || 1;
    return amount * rate;
  };

  return {
    rates,
    loading,
    error,
    convertToTRY,
    refetch: fetchRates,
  };
};
