'use client';

import { useState, useEffect } from 'react';
import { apiService, type Account } from '../api';
import { useExchangeRates } from './useExchangeRates';
import { useAuth } from '../auth-context';
import { 
  AccountType, 
  CurrencyType, 
  getAccountTypeLabel, 
  getCurrencyTypeLabel, 
  getCurrencySymbol 
} from '../../types/enums';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { convertToTRY } = useExchangeRates();

  const fetchAccounts = async () => {
    if (!isAuthenticated) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMyAccounts();
      
      const adaptedAccounts = data.map((account: any, index) => {
        
        const frontendAccount = {
          ...account,
          availableBalance: account.balance || 0,
          currentBalance: account.balance || 0,
          officialName: `${getAccountTypeLabel(account.accountType || 1)} Hesabı`,
          mask: (account.iban || '0000').slice(-4),
          name: `${getAccountTypeLabel(account.accountType || 1)} Hesabı`,
          type: getAccountTypeLabel(account.accountType || 1).toLowerCase(),
          accountNumber: account.iban || '',
          routingNumber: '',
          institutionId: '',
          institutionName: 'Bank Project',
          nickname: `${getAccountTypeLabel(account.accountType || 1)} Hesabı`,
          status: account.isActive ? 'active' : 'inactive',
          displayName: `${getAccountTypeLabel(account.accountType || 1)} Hesabı`,
          shortName: `${getAccountTypeLabel(account.accountType || 1)}`,
          accountSubType: getAccountTypeLabel(account.accountType || 1).toLowerCase(),
          accountCategory: 'checking',
          formattedBalance: `${getCurrencySymbol(account.currencyType || 1)}${(account.balance || 0).toLocaleString('tr-TR')}`,
          accountHolderName: 'User',
          accountHolderType: 'individual',
          lastUpdated: account.dateCreated || new Date().toISOString(),
          accountStatus: account.isActive ? 'active' : 'inactive',
          accountDescription: `${getAccountTypeLabel(account.accountType || 1)} Hesabı`,
          accountFeatures: [],
          accountLimits: {
            dailyLimit: 10000,
            monthlyLimit: 100000
          },
          accountSettings: {
            notifications: true,
            alerts: true
          }
        };
        
        return frontendAccount;
      });
      
      setAccounts(adaptedAccounts);
    } catch (err: any) {
      setError(err.message || 'Hesaplar yüklenirken hata oluştu');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [isAuthenticated]);

  const createAccount = async (accountData: { currencyType: number; accountType: number }) => {
    const userId = apiService.getCurrentUserId();
    if (!userId) throw new Error('Kullanıcı bilgisi bulunamadı');

    try {
      const newAccount = await apiService.createAccount({
        UserId: userId,
        CurrencyType: accountData.currencyType,
        AccountType: accountData.accountType,
        IsActive: true,
      });
      
      await fetchAccounts();
      return newAccount;
    } catch (err: any) {
      throw new Error(err.message || 'Hesap oluşturulurken hata oluştu');
    }
  };

  const deleteAccount = async (accountId: number) => {
    try {
      await apiService.deleteAccount(accountId);
      await fetchAccounts();
    } catch (err: any) {
      throw new Error(err.message || 'Hesap silinirken hata oluştu');
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => {
      const balance = account.balance || 0;
      const currencyType = account.currencyType || 0;
      const balanceInTRY = convertToTRY(balance, currencyType);
      return total + balanceInTRY;
    }, 0);
  };

  const getAccountsByType = (accountType: number) => {
    return accounts.filter(account => account.accountType === accountType);
  };


  return {
    accounts,
    loading,
    error,
    createAccount,
    deleteAccount,
    getTotalBalance,
    getAccountsByType,
    getCurrencyTypeLabel,
    getCurrencySymbol,
    getAccountTypeLabel,
    refetch: fetchAccounts,
  };
}
