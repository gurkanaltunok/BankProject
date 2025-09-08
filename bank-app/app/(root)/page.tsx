'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeaderBox from '@/components/HeaderBox'
import TotalBalanceBox from '@/components/TotalBalanceBox';
import { useAuth } from '@/lib/auth-context';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { AccountType, CurrencyType, getAccountTypeLabel, getCurrencyTypeLabel, getCurrencySymbol } from '@/types/enums';

const Home = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { accounts, loading: accountsLoading, getTotalBalance } = useAccounts();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || accountsLoading) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Convert API accounts to legacy format for existing components
  const legacyAccounts = accounts.map((account, index) => ({
    ...account,
    currentBalance: account.balance || 0,
    availableBalance: account.balance || 0,
    name: `${account.iban || 'Hesap'}`,
    officialName: `Hesap ${account.id || 'N/A'}`,
    // Bank compatibility
    $id: `account-${account.id || index}`,
    accountId: (account.id || 0).toString(),
    bankId: `bank-${account.id || index}`,
    accessToken: '',
    fundingSourceUrl: '',
    userId: account.userId || 0,
    sharableId: `share-${account.id || index}`,
  }));

  const legacyUser = {
    id: user?.id || 0,
    name: user?.name || 'Kullanıcı',
    surname: user?.surname || '',
    email: user?.email || 'user@example.com',
    roleId: user?.roleId || 1,
    // Legacy compatibility
    firstName: user?.name || 'Kullanıcı',
    lastName: user?.surname || '',
  };

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox 
            type="greeting"
            title="Hoşgeldin,"
            user={user?.name || 'Kullanıcı'}
            subtext="Banka hesaplarını ve işlemlerini yönet"
          />

          <TotalBalanceBox 
            accounts={legacyAccounts}
            totalBanks={accounts.length}
            totalCurrentBalance={getTotalBalance()}
          />
        </header>

        <div className="mt-8">
          <h2 className="text-20 font-semibold text-gray-900">Hesaplarım</h2>
          {accounts.length === 0 ? (
            <div className="mt-4 text-gray-600">
              Henüz hesabınız bulunmuyor. Yeni hesap açmak için My Banks sayfasını ziyaret edin.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account, index) => (
                <div key={account.id || `account-${index}`} className="p-4 border rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{account.iban || 'N/A'}</h3>
                      <p className="text-sm text-gray-600">
                        {getAccountTypeLabel(account.accountType || 0)} Hesap
                      </p>
                      <p className="text-sm text-gray-600">
                        {getCurrencyTypeLabel(account.currencyType || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {getCurrencySymbol(account.currencyType || 0)}{(account.balance || 0).toLocaleString('tr-TR', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Home