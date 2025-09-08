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
    console.log('fetchAccounts called - isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      console.log('Not authenticated, returning empty accounts');
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Calling apiService.getMyAccounts()');
      const data = await apiService.getMyAccounts();
      console.log('Raw API data:', data);
      console.log('First account structure:', data[0]);
      console.log('First account AccountId:', data[0]?.AccountId);
      console.log('First account id:', data[0]?.id);
      
      // API'den gelen Account verilerini frontend formatına çevir
      const adaptedAccounts = data.map((account: any, index) => {
        console.log(`Account ${index}:`, account);
        console.log(`Account ${index} id:`, account.id);
        console.log(`Account ${index} accountId:`, account.accountId);
        
        // Backend'den gelen veriyi frontend formatına çevir
        const frontendAccount = {
          ...account,
          // Additional fields for UI compatibility
          availableBalance: account.balance || 0,
          currentBalance: account.balance || 0,
          officialName: `${getAccountTypeLabel(account.accountType || 1)} Hesabı`,
          mask: (account.iban || '0000').slice(-4),
          name: `${getAccountTypeLabel(account.accountType || 1)} Hesabı`,
          type: getAccountTypeLabel(account.accountType || 1).toLowerCase(),
          // Additional fields for compatibility
          accountNumber: account.iban || '',
          routingNumber: '',
          institutionId: '',
          institutionName: 'Bank Project',
          nickname: `${getAccountTypeLabel(account.accountType || 1)} Hesabı`,
          status: account.isActive ? 'active' : 'inactive',
          // Additional fields for UI
          displayName: `${getAccountTypeLabel(account.accountType || 1)} Hesabı`,
          shortName: `${getAccountTypeLabel(account.accountType || 1)}`,
          // Additional fields for compatibility
          accountSubType: getAccountTypeLabel(account.accountType || 1).toLowerCase(),
          accountCategory: 'checking',
          // Additional fields for UI
          formattedBalance: `${getCurrencySymbol(account.currencyType || 1)}${(account.balance || 0).toLocaleString('tr-TR')}`,
          // Additional fields for compatibility
          accountHolderName: 'User',
          accountHolderType: 'individual',
          // Additional fields for UI
          lastUpdated: account.dateCreated || new Date().toISOString(),
          // Additional fields for compatibility
          accountStatus: account.isActive ? 'active' : 'inactive',
          // Additional fields for UI
          accountDescription: `${getAccountTypeLabel(account.accountType || 1)} Hesabı`,
          // Additional fields for compatibility
          accountFeatures: [],
          // Additional fields for UI
          accountLimits: {
            dailyLimit: 10000,
            monthlyLimit: 100000
          },
          // Additional fields for compatibility
          accountSettings: {
            notifications: true,
            alerts: true
          }
        };
        
        console.log(`Account ${index} final:`, frontendAccount);
        console.log(`Account ${index} final id:`, frontendAccount.id);
        return frontendAccount;
      });
      
      console.log('Adapted accounts:', adaptedAccounts);
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
      
      // Refresh accounts list
      await fetchAccounts();
      return newAccount;
    } catch (err: any) {
      throw new Error(err.message || 'Hesap oluşturulurken hata oluştu');
    }
  };

  const deleteAccount = async (accountId: number) => {
    try {
      await apiService.deleteAccount(accountId);
      // Refresh accounts list
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
