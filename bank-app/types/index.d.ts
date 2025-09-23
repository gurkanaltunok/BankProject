/* eslint-disable no-unused-vars */

declare type SearchParamProps = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// ========================================

declare type SignUpParams = {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  dateOfBirth: string;
  ssn: string;
  email: string;
  password: string;
};

declare type LoginUser = {
  TCKN: string;
  Password: string;
};

declare type RegisterUser = {
  Name: string;
  Surname: string;
  TCKN: string;
  Email: string;
  Password: string;
  PhoneNumber: string;
  Address: string;
  RoleId: number;
};

declare type AuthResponse = {
  Token: string;
  UserId: number;
  RoleId: number;
};

declare type User = {
  id: number;
  name?: string;
  surname?: string;
  email?: string;
  roleId: number;
  $id?: string;
  userId?: string;
  dwollaCustomerUrl?: string;
  dwollaCustomerId?: string;
  firstName?: string;
  lastName?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  dateOfBirth?: string;
  ssn?: string;
};

declare type NewUserParams = {
  userId: string;
  email: string;
  name: string;
  password: string;
};

declare type Account = {
  AccountId?: number;
  UserId?: number;
  CurrencyType?: number; // 0: TRY, 1: USD, 2: EUR
  AccountType?: number;  // 0: Savings, 1: Current, 2: Credit
  Balance?: number;
  IBAN?: string;
  DateCreated?: string;
  IsActive?: boolean;
  id?: number;
  userId?: number;
  currencyType?: number;
  accountType?: number;
  balance?: number;
  iban?: string;
  dateCreated?: string;
  isActive?: boolean;
  availableBalance?: number;
  currentBalance?: number;
  officialName?: string;
  mask?: string;
  institutionId?: string;
  name?: string;
  type?: string;
  subtype?: string;
  appwriteItemId?: string;
  sharableId?: string;
};

declare type Transaction = {
  TransactionId: number;
  AccountId: number;
  TransactionType: number; // 0: Deposit, 1: Withdraw, 2: Transfer
  Amount: number;
  Description: string;
  TransactionDate: string;
  BalanceAfter: number;
  id?: number;
  accountId?: number;
  transactionType?: number;
  amount?: number;
  description?: string;
  transactionDate?: string;
  balanceAfter?: number;
  $id?: string;
  name?: string;
  paymentChannel?: string;
  type?: string;
  pending?: boolean;
  category?: string;
  date?: string;
  image?: string;
  $createdAt?: string;
  channel?: string;
  senderBankId?: string;
  receiverBankId?: string;
};

declare type Bank = {
  $id: string;
  accountId?: string;
  bankId?: string;
  accessToken?: string;
  fundingSourceUrl?: string;
  userId?: number;
  sharableId?: string;
  id?: number;
  currencyType?: number;
  accountType?: number;
  balance?: number;
  iban?: string;
  dateCreated?: string;
  isActive?: boolean;
  availableBalance?: number;
  currentBalance?: number;
  officialName?: string;
  name?: string;
};

declare type AccountTypes =
  | "vadesiz"
  | "vadeli"
  | "kredi"
  | "ticari";

declare type Category = "Deposit" | "Withdraw" | "Transfer";

declare type CategoryCount = {
  name: string;
  count: number;
  totalCount: number;
};

declare type Receiver = {
  firstName: string;
  lastName: string;
};

declare type TransferParams = {
  sourceFundingSourceUrl: string;
  destinationFundingSourceUrl: string;
  amount: string;
};

declare type AddFundingSourceParams = {
  dwollaCustomerId: string;
  processorToken: string;
  bankName: string;
};

declare type NewDwollaCustomerParams = {
  firstName: string;
  lastName: string;
  email: string;
  type: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  dateOfBirth: string;
  ssn: string;
};

declare interface CreditCardProps {
  account: Account;
  userName: string;
  showBalance?: boolean;
}

declare interface BankInfoProps {
  account: Account;
  appwriteItemId?: string;
  type: "full" | "card";
}

declare interface HeaderBoxProps {
  type?: "title" | "greeting";
  title: string;
  subtext: string;
  user?: string;
}

declare interface MobileNavProps {
  user: User;
}

declare interface PageHeaderProps {
  topTitle: string;
  bottomTitle: string;
  topDescription: string;
  bottomDescription: string;
  connectBank?: boolean;
}

declare interface PaginationProps {
  page: number;
  totalPages: number;
}

declare interface PlaidLinkProps {
  user: User;
  variant?: "primary" | "ghost";
  dwollaCustomerId?: string;
}

declare interface AuthFormProps {
  type: "sign-in" | "sign-up";
}

declare interface BankDropdownProps {
  accounts: Account[];
  setValue?: UseFormSetValue<any>;
  otherStyles?: string;
}

declare interface BankTabItemProps {
  account: Account;
  appwriteItemId?: string;
}

declare interface TotalBalanceBoxProps {
  accounts: Account[];
  totalBanks: number;
  totalCurrentBalance: number;
}

declare interface FooterProps {
  user: User;
}

declare interface RightSidebarProps {
  user: User;
  transactions: Transaction[];
  banks: Bank[] & Account[];
}

declare interface SiderbarProps {
  user: User;
}

declare interface RecentTransactionsProps {
  accounts: Account[];
  transactions: Transaction[];
  appwriteItemId: string;
  page: number;
}

declare interface TransactionHistoryTableProps {
  transactions: Transaction[];
  page: number;
}

declare interface CategoryBadgeProps {
  category: string;
}

declare interface TransactionTableProps {
  transactions: Transaction[];
}

declare interface CategoryProps {
  category: CategoryCount;
}

declare interface DoughnutChartProps {
  accounts: Account[];
}

declare interface PaymentTransferFormProps {
  accounts: Account[];
}

declare interface getAccountsProps {
  userId: string;
}

declare interface getAccountProps {
  appwriteItemId: string;
}

declare interface getInstitutionProps {
  institutionId: string;
}

declare interface getTransactionsProps {
  accessToken: string;
}

declare interface CreateFundingSourceOptions {
  customerId: string;
  fundingSourceName: string;
  plaidToken: string;
  _links: object;
}

declare interface CreateTransactionProps {
  name: string;
  amount: string;
  senderId: string;
  senderBankId: string;
  receiverId: string;
  receiverBankId: string;
  email: string;
}

declare interface getTransactionsByBankIdProps {
  bankId: string;
}

declare interface signInProps {
  email: string;
  password: string;
}

declare interface getUserInfoProps {
  userId: string;
}

declare interface exchangePublicTokenProps {
  publicToken: string;
  user: User;
}

declare interface createBankAccountProps {
  accessToken: string;
  userId: string;
  accountId: string;
  bankId: string;
  fundingSourceUrl: string;
  sharableId: string;
}

declare interface getBanksProps {
  userId: string;
}

declare interface getBankProps {
  documentId: string;
}

declare interface getBankByAccountIdProps {
  accountId: string;
}
