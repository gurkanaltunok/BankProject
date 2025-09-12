const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5020/api';

// API Response types
interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
}

// Auth types matching the API
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
  RoleId: number;
}

interface AuthResponse {
  Token: string;
  UserId: number;
  RoleId: number;
}

// Account types matching the API
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
  // Additional fields for UI compatibility
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

// Transaction types
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
      // Handle JWT token expiration
      if (response.status === 401) {
        // Clear stored authentication data
        this.logout();
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/sign-in';
        }
        throw new Error('Authentication expired. Please login again.');
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

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('Login request:', credentials);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const result = await this.handleResponse<any>(response);
    
    console.log('Response data:', result);
    
    // Convert camelCase response to PascalCase
    const authResponse: AuthResponse = {
      Token: result.token || result.Token,
      UserId: result.userId || result.UserId,
      RoleId: result.roleId || result.RoleId,
    };
    
    console.log('Converted auth response:', authResponse);
    
    // Store token in localStorage
    if (authResponse.Token) {
      localStorage.setItem('authToken', authResponse.Token);
      localStorage.setItem('userId', authResponse.UserId.toString());
      localStorage.setItem('roleId', authResponse.RoleId.toString());
      console.log('Token stored in localStorage');
    } else {
      console.log('No token found in response');
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
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        // Token is expired, clear it
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      // Invalid token format, clear it
      this.logout();
      return false;
    }
  }

  getCurrentUserId(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : null;
  }

  // Method to validate token and refresh if needed
  async validateToken(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      // Try to make a request to validate the token
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

  // Account methods
  async createAccount(accountData: AccountDto): Promise<Account> {
    console.log('Creating account with data:', accountData);
    
    // Backend expects AccountDTO directly with string values
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

    console.log('Create account response status:', response.status);
    const data = await this.handleResponse<Account>(response);
    console.log('Create account response data:', data);
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
    console.log('Getting my accounts...');
    const response = await fetch(`${API_BASE_URL}/accounts/my-accounts`, {
      headers: this.getAuthHeaders(),
    });

    console.log('My accounts response status:', response.status);
    const data = await this.handleResponse<any[]>(response);
    console.log('My accounts data:', data);
    console.log('First account raw data:', data[0]);
    console.log('First account AccountId:', data[0]?.AccountId);
    console.log('First account keys:', Object.keys(data[0] || {}));
    console.log('First account values:', Object.values(data[0] || {}));
    
    // Backend'den gelen camelCase veriyi frontend formatına çevir
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
      // Additional fields for UI compatibility
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
    console.log('Transfer API call with data:', data);
    const response = await fetch(`${API_BASE_URL}/transactions/transfer`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    console.log('Transfer API response status:', response.status);
    if (!response.ok) {
      console.log('Transfer API error - response not ok');
    }

    return await this.handleResponse<Transaction>(response);
  }

  async getTransactionsByAccount(accountId: number): Promise<Transaction[]> {
    console.log('API getTransactionsByAccount called with accountId:', accountId);
    const response = await fetch(`${API_BASE_URL}/transactions/account/${accountId}`, {
      headers: this.getAuthHeaders(),
    });

    console.log('API getTransactionsByAccount response status:', response.status);
    const data = await this.handleResponse<any[]>(response);
    console.log('API getTransactionsByAccount raw data:', data);
    console.log('First transaction keys:', data[0] ? Object.keys(data[0]) : 'No data');
    console.log('First transaction values:', data[0] ? Object.values(data[0]) : 'No data');
    
    // Backend'den gelen veriyi frontend formatına çevir
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
    
    console.log('API getTransactionsByAccount mapped data:', mappedData);
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

    console.log('getTransactionsByDateRange API call:', {
      startDate,
      endDate,
      accountId,
      url: `${API_BASE_URL}/transactions/filter?${params.toString()}`
    });

    const response = await fetch(`${API_BASE_URL}/transactions/filter?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });

    const data = await this.handleResponse<any[]>(response);
    console.log('getTransactionsByDateRange raw response:', data);
    
    // Backend'den gelen camelCase veriyi frontend formatına çevir
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
    
    console.log('getTransactionsByDateRange mapped data:', mappedData);
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

  // Balance History methods
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

export type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  Account, 
  AccountDto, 
  Transaction, 
  DepositWithdrawRequest, 
  TransferRequest 
};
