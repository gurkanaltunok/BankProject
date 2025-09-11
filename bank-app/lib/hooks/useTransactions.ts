'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService, type Transaction } from '../api';
import { useAuth } from '../auth-context';

export function useTransactions(accountId?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchTransactions = async (targetAccountId?: number) => {
    if (!isAuthenticated) {
      setTransactions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let data: Transaction[];
      if (targetAccountId) {
        data = await apiService.getTransactionsByAccount(targetAccountId);
      } else {
        data = await apiService.getTransactionsByDateRange();
      }
      
      console.log('Raw transaction data:', data);
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'İşlemler yüklenirken hata oluştu');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchTransactions(accountId);
    }
  }, [accountId, isAuthenticated]);

  const deposit = async (accountId: number, amount: number, description: string) => {
    try {
      const transaction = await apiService.deposit({
        AccountId: accountId,
        Amount: amount,
        Description: description,
      });
      
      // Refresh transactions
      await fetchTransactions(accountId);
      return transaction;
    } catch (err: any) {
      throw new Error(err.message || 'Para yatırma işlemi başarısız');
    }
  };

  const withdraw = async (accountId: number, amount: number, description: string) => {
    try {
      const transaction = await apiService.withdraw({
        AccountId: accountId,
        Amount: amount,
        Description: description,
      });
      
      // Refresh transactions
      await fetchTransactions(accountId);
      return transaction;
    } catch (err: any) {
      throw new Error(err.message || 'Para çekme işlemi başarısız');
    }
  };

  const transfer = async (fromAccountId: number, toAccountId: number, amount: number, description: string) => {
    try {
      const transaction = await apiService.transfer({
        FromAccountId: fromAccountId,
        ToAccountId: toAccountId,
        Amount: amount,
        Description: description,
      });
      
      // Refresh transactions for source account
      await fetchTransactions(fromAccountId);
      return transaction;
    } catch (err: any) {
      throw new Error(err.message || 'Transfer işlemi başarısız');
    }
  };

  const getTransactionsByDateRange = async (startDate?: string, endDate?: string, targetAccountId?: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getTransactionsByDateRange(startDate, endDate, targetAccountId);
      setTransactions(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'İşlemler yüklenirken hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeLabel = (transactionType: number) => {
    switch (transactionType) {
      case 1: return 'Para Yatırma'; // Deposit = 1
      case 2: return 'Para Çekme';   // Withdraw = 2
      case 3: return 'Transfer';     // Transfer = 3
      default: return 'Bilinmeyen';
    }
  };

  const getTransactionTypeColor = (transactionType: number) => {
    switch (transactionType) {
      case 1: return 'text-green-600 font-semibold'; // Deposit = 1 - Yeşil
      case 2: return 'text-red-600 font-semibold';   // Withdraw = 2 - Kırmızı
      case 3: return 'text-red-600 font-semibold';   // Transfer = 3 - Kırmızı (bakiye azalır)
      default: return 'text-gray-600';
    }
  };

  const getTransactionsByAccount = useCallback(async (targetAccountId: number) => {
    try {
      console.log('getTransactionsByAccount called with accountId:', targetAccountId);
      setLoading(true);
      setError(null);
      const data = await apiService.getTransactionsByAccount(targetAccountId);
      console.log('getTransactionsByAccount response:', data);
      setTransactions(data);
      return data;
    } catch (err: any) {
      console.error('getTransactionsByAccount error:', err);
      setError(err.message || 'İşlemler yüklenirken hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    transactions,
    loading,
    error,
    deposit,
    withdraw,
    transfer,
    getTransactionsByDateRange,
    getTransactionsByAccount,
    getTransactionTypeLabel,
    getTransactionTypeColor,
    refetch: () => fetchTransactions(accountId),
  };
}
