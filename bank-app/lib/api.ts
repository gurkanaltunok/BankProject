const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5020/api';

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
}

interface LoginRequest {
  TCKN: string;
  Password: string;
}

interface RegisterRequest {
  Name: string;
  Surname: string;
  TCKN: string;
  Email: string;
  Password: string;
  PhoneNumber: string;
  Address: string;
  BirthDate: Date;
  RoleId: number;
}

interface AuthResponse {
  Token: string;
  UserId: number;
  RoleId: number;
}

interface AccountDto {
  UserId: number;
  CurrencyType: number; // 0: TRY, 1: USD, 2: EUR
  AccountType: number;  // 0: Savings, 1: Current, 2: Credit
  IsActive: boolean;
}

interface Account {
  id: number;
  accountId: number;
  userId: number;
  currencyType: number;
  accountType: number;
  balance: number;
  iban: string;
  dateCreated: string;
  isActive: boolean;
  availableBalance?: number;
  currentBalance?: number;
  officialName?: string;
  mask?: string;
  name?: string;
  type?: string;
  accountNumber?: string;
  routingNumber?: string;
  institutionId?: string;
  institutionName?: string;
  nickname?: string;
  status?: string;
  displayName?: string;
  shortName?: string;
  accountSubType?: string;
  accountCategory?: string;
  formattedBalance?: string;
  accountHolderName?: string;
  accountHolderType?: string;
  lastUpdated?: string;
  accountStatus?: string;
  accountDescription?: string;
  accountFeatures?: any[];
  accountLimits?: {
    dailyLimit: number;
    monthlyLimit: number;
  };
  accountSettings?: {
    notifications: boolean;
    alerts: boolean;
  };
}

interface DepositWithdrawRequest {
  AccountId: number;
  Amount: number;
  Description: string;
}

interface TransferRequest {
  FromAccountId: number;
  ToAccountId: number;
  Amount: number;
  Description: string;
}

interface Transaction {
  id: number;
  accountId: number;
  transactionType: number;
  amount: number;
  description: string;
  transactionDate: string;
  balanceAfter: number;
  fee?: number;
  feeInTRY?: number;
  exchangeRate?: {
    exchangeRateId: number;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    date: string;
    source?: string;
  };
  targetAccountId?: number;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        // Login sayfasındaysak logout yapma
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/sign-in')) {
          this.logout();
          window.location.href = '/sign-in';
        }
        throw new Error('Invalid credentials');
      }
      
      if (response.status === 400) {
        const errorData = await response.text();
        if (errorData.includes('Invalid') || errorData.includes('Wrong') || errorData.includes('not found')) {
          throw new Error('Invalid credentials');
        }
        throw new Error(errorData || 'Bad request');
      }
      
      const errorData = await response.text();
      throw new Error(errorData || `HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text() as unknown as T;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });


    const result = await this.handleResponse<any>(response);
    
    
    const authResponse: AuthResponse = {
      Token: result.token || result.Token,
      UserId: result.userId || result.UserId,
      RoleId: result.roleId || result.RoleId,
    };
    
    
    if (authResponse.Token) {
      localStorage.setItem('authToken', authResponse.Token);
      localStorage.setItem('userId', authResponse.UserId.toString());
      localStorage.setItem('roleId', authResponse.RoleId.toString());
    } else {
    }
    
    return authResponse;
  }

  async register(userData: RegisterRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    return await this.handleResponse(response);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('roleId');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  getCurrentUserId(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : null;
  }

  getCurrentToken(): string | null {
    return localStorage.getItem('token');
  }

  displayTokenInfo(): void {
    const token = this.getCurrentToken();
    const userId = this.getCurrentUserId();
    const roleId = localStorage.getItem('roleId');
    
    console.log('🔍 Current Token Info:');
    console.log('🔑 Token:', token);
    console.log('👤 User ID:', userId);
    console.log('🔐 Role ID:', roleId);
    
    if (token) {
      // JWT token'ı decode etmeye çalış (sadece payload kısmı)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('📋 Token Payload:', payload);
      } catch (e) {
        console.log('❌ Token decode edilemedi');
      }
    }
  }

  async validateToken(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: this.getAuthHeaders(),
      });

      if (response.status === 401) {
        this.logout();
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      this.logout();
      return false;
    }
  }

  async createAccount(accountData: AccountDto): Promise<Account> {
    
    const requestData = {
      UserId: accountData.UserId,
      CurrencyType: accountData.CurrencyType.toString(),
      AccountType: accountData.AccountType.toString(),
      IsActive: accountData.IsActive
    };
    
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const data = await this.handleResponse<Account>(response);
    return data;
  }

  async getAccountById(id: number): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<Account>(response);
  }

  async getAllAccounts(): Promise<Account[]> {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<Account[]>(response);
  }

  async getMyAccounts(): Promise<Account[]> {
    const response = await fetch(`${API_BASE_URL}/accounts/my-accounts`, {
      headers: this.getAuthHeaders(),
    });

    const data = await this.handleResponse<any[]>(response);
    
    return data.map(account => ({
      id: account.accountId,
      accountId: account.accountId,
      accountType: account.accountType,
      balance: account.balance || 0,
      currencyType: account.currencyType,
      iban: account.iban,
      isActive: account.isActive,
      userId: account.userId,
      dateCreated: account.dateCreated,
      availableBalance: account.balance || 0,
      currentBalance: account.balance || 0,
      officialName: `${account.accountType || 1} Hesabı`,
      mask: (account.iban || '0000').slice(-4),
      name: `${account.accountType || 1} Hesabı`,
      type: `${account.accountType || 1}`.toLowerCase(),
      accountNumber: account.iban || '',
      routingNumber: '',
      institutionId: '',
      institutionName: 'Bank Project',
      nickname: `${account.accountType || 1} Hesabı`,
      status: account.isActive ? 'active' : 'inactive',
      displayName: `${account.accountType || 1} Hesabı`,
      shortName: `${account.accountType || 1}`,
      accountSubType: `${account.accountType || 1}`.toLowerCase(),
      accountCategory: 'checking',
      formattedBalance: `₺${(account.balance || 0).toLocaleString('tr-TR')}`,
      accountHolderName: 'User',
      accountHolderType: 'individual',
      lastUpdated: account.dateCreated || new Date().toISOString(),
      accountStatus: account.isActive ? 'active' : 'inactive',
      accountDescription: `${account.accountType || 1} Hesabı`,
      accountFeatures: [],
      accountLimits: {
        dailyLimit: 10000,
        monthlyLimit: 100000
      },
      accountSettings: {
        notifications: true,
        alerts: true
      }
    }));
  }

  async getMyTotalBalance(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/accounts/my-total-balance`, {
      headers: this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ totalBalanceInTRY: number }>(response);
    
    return data.totalBalanceInTRY;
  }

  async getCurrentUser(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<any>(response);
  }

  async getAccountByIban(iban: string): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts/by-iban/${iban}`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<Account>(response);
  }

  async deleteAccount(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  // Transaction methods
  async deposit(data: DepositWithdrawRequest): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transactions/deposit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return await this.handleResponse<Transaction>(response);
  }

  async withdraw(data: DepositWithdrawRequest): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transactions/withdraw`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return await this.handleResponse<Transaction>(response);
  }

  async transfer(data: TransferRequest): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transactions/transfer`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
    }

    return await this.handleResponse<Transaction>(response);
  }

  async getTransactionsByAccount(accountId: number): Promise<Transaction[]> {
    const response = await fetch(`${API_BASE_URL}/transactions/account/${accountId}`, {
      headers: this.getAuthHeaders(),
    });

    const data = await this.handleResponse<any[]>(response);
    
    const mappedData = data.map(transaction => ({
      id: transaction.transactionId,
      accountId: transaction.accountId,
      transactionType: transaction.transactionType,
      amount: transaction.amount,
      description: transaction.description,
      transactionDate: transaction.transactionDate,
      balanceAfter: transaction.balanceAfter,
      fee: transaction.fee,
      feeInTRY: transaction.feeInTRY,
      exchangeRate: transaction.exchangeRate,
      targetAccountId: transaction.targetAccountId,
    }));
    
    return mappedData;
  }

  async getTransactionsByDateRange(
    startDate?: string,
    endDate?: string,
    accountId?: number
  ): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (accountId) params.append('accountId', accountId.toString());


    const response = await fetch(`${API_BASE_URL}/transactions/filter?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });

    const data = await this.handleResponse<any[]>(response);
    
    const mappedData = data.map(transaction => ({
      id: transaction.transactionId,
      accountId: transaction.accountId,
      transactionType: transaction.transactionType,
      amount: transaction.amount,
      description: transaction.description,
      transactionDate: transaction.transactionDate,
      balanceAfter: transaction.balanceAfter,
      fee: transaction.fee,
      targetAccountId: transaction.targetAccountId,
    }));
    
    return mappedData;
  }

  async updateUser(userData: {
    name: string;
    surname: string;
    email: string;
    phoneNumber: string;
    address: string;
    tckn: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/update`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Name: userData.name,
        Surname: userData.surname,
        Email: userData.email,
        PhoneNumber: userData.phoneNumber,
        Address: userData.address,
        TCKN: userData.tckn,
      }),
    });

    return await this.handleResponse<any>(response);
  }

  async getBalanceHistoryByAccount(accountId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/balancehistory/account/${accountId}`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<any[]>(response);
  }

  async getBalanceHistoryByDateRange(accountId: number, startDate: string, endDate: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/balancehistory/account/${accountId}/daterange?startDate=${startDate}&endDate=${endDate}`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<any[]>(response);
  }

  // Admin API
  async getAdminDashboard(): Promise<any> {
    const timestamp = new Date().getTime();
    const response = await fetch(`${API_BASE_URL}/admin/dashboard?t=${timestamp}`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<any>(response);
  }

  async getBankBalance(): Promise<{ balance: number }> {
    const response = await fetch(`${API_BASE_URL}/admin/bank-balance`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<{ balance: number }>(response);
  }

  async getTotalBalance(): Promise<{ totalBalance: number }> {
    const response = await fetch(`${API_BASE_URL}/admin/total-balance`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<{ totalBalance: number }>(response);
  }

  async getAllUsers(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<any[]>(response);
  }

  async updateUserRole(userId: number, roleId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ roleId }),
    });

    return await this.handleResponse<any>(response);
  }

  async getDailyTransactionVolume(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/admin/daily-transaction-volume`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<any[]>(response);
  }

  async getDailyCommissionRevenue(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/admin/daily-commission-revenue`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<any[]>(response);
  }

  async getCities(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/location/cities`);
    return await this.handleResponse<any[]>(response);
  }

  async getDistricts(cityId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/location/districts/${cityId}`);
    return await this.handleResponse<any[]>(response);
  }

  async createAddress(addressData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/address`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(addressData),
    });

    return await this.handleResponse<any>(response);
  }

  async getAddressByUserId(userId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/address/user/${userId}`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse<any>(response);
  }

  async updateAddress(addressId: number, addressData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/address/${addressId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(addressData),
    });

    return await this.handleResponse<any>(response);
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passwordData),
    });

    return await this.handleResponse<any>(response);
  }

  async exchangeBuy(request: ExchangeBuyRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/transactions/exchange-buy`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    return await this.handleResponse<any>(response);
  }

  async exchangeSell(request: ExchangeSellRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/transactions/exchange-sell`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    return await this.handleResponse<any>(response);
  }
}

export const apiService = new ApiService();
export interface BalanceHistory {
  id: number;
  accountId: number;
  balance: number;
  previousBalance: number;
  changeAmount: number;
  changeType: string;
  description: string;
  date: string;
  transactionId?: number;
}

interface ExchangeBuyRequest {
  FromAccountId: number;
  ToAccountId: number;
  AmountTRY: number;
  AmountForeign: number;
  Rate: number;
  Description?: string;
}

interface ExchangeSellRequest {
  FromAccountId: number;
  ToAccountId: number;
  AmountForeign: number;
  AmountTRY: number;
  Rate: number;
  Description?: string;
}

export type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  Account, 
  AccountDto, 
  Transaction, 
  DepositWithdrawRequest, 
  TransferRequest,
  ExchangeBuyRequest,
  ExchangeSellRequest
};
