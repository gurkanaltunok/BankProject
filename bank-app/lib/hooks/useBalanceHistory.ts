'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService, type BalanceHistory } from '../api';
import { useAuth } from '../auth-context';

export function useBalanceHistory(accountId?: number) {
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchBalanceHistory = useCallback(async (targetAccountId?: number) => {
    if (!isAuthenticated || !targetAccountId) {
      setBalanceHistory([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBalanceHistoryByAccount(targetAccountId);
      setBalanceHistory(data);
    } catch (err: any) {
      setError(err.message || 'Bakiye geçmişi yüklenirken hata oluştu');
      setBalanceHistory([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchBalanceHistoryByDateRange = useCallback(async (targetAccountId: number, startDate: string, endDate: string) => {
    if (!isAuthenticated) {
      setBalanceHistory([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBalanceHistoryByDateRange(targetAccountId, startDate, endDate);
      setBalanceHistory(data);
    } catch (err: any) {
      setError(err.message || 'Bakiye geçmişi yüklenirken hata oluştu');
      setBalanceHistory([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (accountId) {
      fetchBalanceHistory(accountId);
    }
  }, [accountId, fetchBalanceHistory]);

  return {
    balanceHistory,
    loading,
    error,
    fetchBalanceHistory,
    fetchBalanceHistoryByDateRange,
    refetch: () => fetchBalanceHistory(accountId),
  };
}
