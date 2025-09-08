// Backend enum'larından frontend'e aktarılan TypeScript enum'ları

export enum AccountType {
  Vadesiz = 0,
  Vadeli = 1,
  Kredi = 2,
  Ticari = 3
}

export enum CurrencyType {
  TRY = 0,
  USD = 1,
  EUR = 2,
  GBP = 3
}

export enum TransactionType {
  Deposit = 1,
  Withdraw = 2,
  Transfer = 3,
  Fee = 4
}

// Helper functions for enum labels
export const getAccountTypeLabel = (accountType: AccountType | number): string => {
  switch (accountType) {
    case AccountType.Vadesiz:
    case 0:
      return 'Vadesiz';
    case AccountType.Vadeli:
    case 1:
      return 'Vadeli';
    case AccountType.Kredi:
    case 2:
      return 'Kredi';
    case AccountType.Ticari:
    case 3:
      return 'Ticari';
    default:
      return 'Vadesiz';
  }
};

export const getCurrencyTypeLabel = (currencyType: CurrencyType | number): string => {
  switch (currencyType) {
    case CurrencyType.TRY:
    case 0:
      return 'TRY';
    case CurrencyType.USD:
    case 1:
      return 'USD';
    case CurrencyType.EUR:
    case 2:
      return 'EUR';
    case CurrencyType.GBP:
    case 3:
      return 'GBP';
    default:
      return 'TRY';
  }
};

export const getCurrencySymbol = (currencyType: CurrencyType | number): string => {
  switch (currencyType) {
    case CurrencyType.TRY:
    case 0:
      return '₺';
    case CurrencyType.USD:
    case 1:
      return '$';
    case CurrencyType.EUR:
    case 2:
      return '€';
    case CurrencyType.GBP:
    case 3:
      return '£';
    default:
      return '₺';
  }
};

export const getTransactionTypeLabel = (transactionType: TransactionType | number): string => {
  switch (transactionType) {
    case TransactionType.Deposit:
    case 1:
      return 'Para Yatırma';
    case TransactionType.Withdraw:
    case 2:
      return 'Para Çekme';
    case TransactionType.Transfer:
    case 3:
      return 'Transfer';
    case TransactionType.Fee:
    case 4:
      return 'İşlem Ücreti';
    default:
      return 'Bilinmeyen';
  }
};
