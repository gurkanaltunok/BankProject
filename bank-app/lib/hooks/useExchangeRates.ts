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
      // Backend API'mizden güncel döviz kurlarını çek
      const response = await fetch('http://localhost:5020/api/Admin/exchange-service');
      
      if (!response.ok) {
        throw new Error(`API Hatası: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // API'den gelen kurları kontrol et
      if (!data.rates || Object.keys(data.rates).length === 0) {
        throw new Error('ExchangeRate-API çalışmıyor. Kurlar alınamadı.');
      }
      
      // Backend'den gelen kurları kullan
      const newRates: ExchangeRate[] = [
        { currency: 'USD', rate: data.rates.USD || 1 },
        { currency: 'EUR', rate: data.rates.EUR || 1 },
        { currency: 'TRY', rate: 1.00 },
      ];
      
      setRates(newRates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Döviz kurları alınamadı');
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
