using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using BankProject.Entities.Enums;

namespace BankProject.Business.Concrete
{
    public class TransactionManager : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IAccountRepository _accountRepository;
        private readonly IBalanceHistoryService _balanceHistoryService;
        private readonly IExchangeRateService _exchangeRateService;
        private readonly IExchangeRateRepository _exchangeRateRepository;
        private readonly HttpClient _httpClient;

        public TransactionManager(ITransactionRepository transactionRepository, IAccountRepository accountRepository, IBalanceHistoryService balanceHistoryService, IExchangeRateService exchangeRateService, IExchangeRateRepository exchangeRateRepository, HttpClient httpClient)
        {
            _transactionRepository = transactionRepository;
            _accountRepository = accountRepository;
            _balanceHistoryService = balanceHistoryService;
            _exchangeRateService = exchangeRateService;
            _exchangeRateRepository = exchangeRateRepository;
            _httpClient = httpClient;
        }

        private Account GetActiveAccount(int accountId)
        {
            var account = _accountRepository.GetAccountById(accountId);
            if (account == null || !account.IsActive)
                throw new Exception("Hesap bulunamadı veya aktif değil.");
            return account;
        }

        private Account GetBankAccount() => GetActiveAccount(1); // Banka AccountId = 1

        private string GetCurrencyString(CurrencyType currencyType)
        {
            return currencyType switch
            {
                CurrencyType.TRY => "TRY",
                CurrencyType.USD => "USD",
                CurrencyType.EUR => "EUR",
                CurrencyType.GBP => "GBP",
                _ => "TRY"
            };
        }

        private Task<(decimal rate, int exchangeRateId)> GetCurrentExchangeRateAsync(string fromCurrency, string toCurrency)
        {
            decimal rate = 1.0m;
            int exchangeRateId = 0;

            try
            {
                rate = _exchangeRateService.ConvertCurrency(1.0m, fromCurrency, toCurrency);

                // Kur bilgisi
                var currentExchangeRate = _exchangeRateRepository.GetLatestExchangeRate();
                exchangeRateId = currentExchangeRate?.ExchangeRateId ?? 0;

            }
            catch (Exception)
            {
                
                throw new Exception($"API erişilemiyor. {fromCurrency} -> {toCurrency} dönüşümü yapılamıyor.");
            }

            return Task.FromResult((rate, exchangeRateId));
        }

        private Transaction AddTransaction(int accountId, int? targetAccountId, decimal amount, decimal fee, int type, string description, decimal? balanceAfter = null, decimal? feeInTRY = null, int? exchangeRateId = null)
        {
            var transaction = new Transaction
            {
                AccountId = accountId,
                TargetAccountId = targetAccountId,
                Amount = amount,
                Fee = fee,
                FeeInTRY = feeInTRY,
                ExchangeRateId = exchangeRateId,
                TransactionType = type,
                Description = description,
                TransactionDate = DateTime.UtcNow,
                BalanceAfter = balanceAfter
            };

            return _transactionRepository.AddTransaction(transaction);
        }

        public TransactionDTO Deposit(int accountId, decimal amount, string description)
        {
            var account = GetActiveAccount(accountId);
            var previousBalance = account.Balance;
            account.Balance += amount;
            _accountRepository.UpdateAccount(account);

            var transaction = AddTransaction(accountId, null, amount, 0, (int)TransactionType.Deposit, description, account.Balance);
            
            _balanceHistoryService.RecordBalanceChange(accountId, previousBalance, account.Balance, amount, "Deposit", description, transaction.TransactionId);
            return new TransactionDTO
            {
                TransactionId = transaction.TransactionId,
                AccountId = transaction.AccountId,
                TargetAccountId = transaction.TargetAccountId,
                Amount = transaction.Amount,
                Fee = transaction.Fee ?? 0,
                Description = transaction.Description,
                TransactionDate = transaction.TransactionDate,
                TransactionType = transaction.TransactionType,
                BalanceAfter = account.Balance
            };
        }

        public TransactionDTO Withdraw(int accountId, decimal amount, string description)
        {
            var account = GetActiveAccount(accountId);
            var bank = GetBankAccount();

            decimal fee = amount * 0.005m;
            decimal totalDebit = amount + fee;

            if (account.Balance < totalDebit)
                throw new Exception("Yetersiz bakiye.");

            var previousBalance = account.Balance;
            var bankPreviousBalance = bank.Balance;
            
            decimal feeInTRY = fee;
            int? exchangeRateId = null;
            if (account.CurrencyType != CurrencyType.TRY)
            {
                var accountCurrency = GetCurrencyString(account.CurrencyType);
                var (rate, rateId) = GetCurrentExchangeRateAsync(accountCurrency, "TRY").Result;
                feeInTRY = fee * rate;
                exchangeRateId = rateId;
            }
            
            account.Balance -= totalDebit;
            bank.Balance += feeInTRY;

            _accountRepository.UpdateAccount(account);
            _accountRepository.UpdateAccount(bank);

            var withdrawTransaction = AddTransaction(accountId, null, amount, fee, (int)TransactionType.Withdraw, description, account.Balance, feeInTRY, exchangeRateId);
            var feeTransaction = AddTransaction(bank.AccountId, accountId, feeInTRY, 0, (int)TransactionType.Fee, $"İşlem Ücreti - Hesap {accountId}", bank.Balance);
            
            _balanceHistoryService.RecordBalanceChange(accountId, previousBalance, account.Balance, -totalDebit, "Withdraw", description, withdrawTransaction.TransactionId);
            _balanceHistoryService.RecordBalanceChange(bank.AccountId, bankPreviousBalance, bank.Balance, feeInTRY, "Fee", $"İşlem Ücreti - Hesap {accountId}", feeTransaction.TransactionId);

            return new TransactionDTO
            {
                TransactionId = withdrawTransaction.TransactionId,
                AccountId = withdrawTransaction.AccountId,
                TargetAccountId = withdrawTransaction.TargetAccountId,
                Amount = withdrawTransaction.Amount,
                Fee = withdrawTransaction.Fee ?? 0,
                Description = withdrawTransaction.Description,
                TransactionDate = withdrawTransaction.TransactionDate,
                TransactionType = withdrawTransaction.TransactionType,
                BalanceAfter = account.Balance
            };
        }

        public TransactionDTO Transfer(int fromAccountId, int toAccountId, decimal amount, string description)
        {
            var fromAccount = GetActiveAccount(fromAccountId);
            var toAccount = GetActiveAccount(toAccountId);
            var bank = GetBankAccount();

            if (fromAccount.CurrencyType != toAccount.CurrencyType)
                throw new Exception($"Farklı para birimlerinden transfer yapılamaz. Gönderen hesap: {fromAccount.CurrencyType}, Alıcı hesap: {toAccount.CurrencyType}");

            decimal fee = amount * 0.005m;
            decimal totalDebit = amount + fee;

            if (fromAccount.Balance < totalDebit)
                throw new Exception("Yetersiz bakiye.");

            decimal feeInTRY = fee;
            int? exchangeRateId = null;
            if (fromAccount.CurrencyType != CurrencyType.TRY)
            {
                var accountCurrency = GetCurrencyString(fromAccount.CurrencyType);
                var (rate, rateId) = GetCurrentExchangeRateAsync(accountCurrency, "TRY").Result;
                feeInTRY = fee * rate;
                exchangeRateId = rateId;
            }

            var fromPreviousBalance = fromAccount.Balance;
            var toPreviousBalance = toAccount.Balance;
            var bankPreviousBalance = bank.Balance;

            fromAccount.Balance -= totalDebit;
            toAccount.Balance += amount;
            bank.Balance += feeInTRY;

            _accountRepository.UpdateAccount(fromAccount);
            _accountRepository.UpdateAccount(toAccount);
            _accountRepository.UpdateAccount(bank);

            var createdTransaction = AddTransaction(fromAccountId, toAccountId, amount, fee, (int)TransactionType.Transfer, description, fromAccount.Balance, feeInTRY, exchangeRateId);

            var bankFeeTx = AddTransaction(bank.AccountId, fromAccountId, feeInTRY, 0, (int)TransactionType.Fee, $"İşlem Ücreti - Hesap {fromAccountId}", bank.Balance);

            _balanceHistoryService.RecordBalanceChange(fromAccountId, fromPreviousBalance, fromAccount.Balance, -totalDebit, "Transfer - Giden", description, createdTransaction.TransactionId);
            _balanceHistoryService.RecordBalanceChange(toAccountId, toPreviousBalance, toAccount.Balance, amount, "Transfer - Gelen", description, createdTransaction.TransactionId);
            _balanceHistoryService.RecordBalanceChange(bank.AccountId, bankPreviousBalance, bank.Balance, feeInTRY, "Fee", $"İşlem Ücreti - Hesap {fromAccountId}", bankFeeTx.TransactionId);

            return new TransactionDTO
            {
                TransactionId = createdTransaction.TransactionId,
                AccountId = createdTransaction.AccountId,
                TargetAccountId = createdTransaction.TargetAccountId,
                Amount = createdTransaction.Amount,
                Fee = createdTransaction.Fee ?? 0,
                Description = createdTransaction.Description,
                TransactionDate = createdTransaction.TransactionDate,
                TransactionType = createdTransaction.TransactionType,
                BalanceAfter = fromAccount.Balance
            };
        }



        public List<Transaction> GetTransactionsByAccountId(int accountId)
        {
            var transactions = _transactionRepository.GetTransactionsByAccountId(accountId);
            return transactions;
        }

        public List<Transaction> GetTransactionsByDateRange(DateTime? startDate, DateTime? endDate, int? accountId, int? userId = null)
        {
            var transactions = _transactionRepository.GetTransactionsByDateRange(startDate, endDate, accountId, userId);
            return transactions;
        }

        public bool CheckAccountOwner(int accountId, int userId)
        {
            var account = _accountRepository.GetAccountById(accountId);
            if (account == null)
                throw new Exception("Hesap bulunamadı.");
            return account.UserId == userId;
        }

        public Task<Transaction> ExchangeBuyAsync(ExchangeBuyDTO dto)
        {
            var tryAccount = GetActiveAccount(dto.FromAccountId);
            if (tryAccount.CurrencyType != CurrencyType.TRY)
                throw new Exception("Kaynak hesap TRY hesabı olmalıdır.");

            var exchangeAccount = GetActiveAccount(dto.ToAccountId);
            if (exchangeAccount.CurrencyType == CurrencyType.TRY)
                throw new Exception("Hedef hesap döviz hesabı olmalıdır.");

            if (tryAccount.UserId != exchangeAccount.UserId)
                throw new Exception("Hesaplar aynı kullanıcıya ait olmalıdır.");

            if (tryAccount.Balance < dto.AmountTRY)
                throw new Exception("TRY hesabında yeterli bakiye bulunmuyor.");

            var commission = dto.AmountTRY * 0.005m;
            var totalAmount = dto.AmountTRY + commission;

            if (tryAccount.Balance < totalAmount)
                throw new Exception($"TRY hesabında yeterli bakiye bulunmuyor. Gerekli tutar: {totalAmount:F2} TRY (İşlem: {dto.AmountTRY:F2} TRY + Komisyon: {commission:F2} TRY)");

            var bankAccount = GetBankAccount();

            tryAccount.Balance -= totalAmount;
            _accountRepository.UpdateAccount(tryAccount);

            exchangeAccount.Balance += dto.AmountForeign;
            _accountRepository.UpdateAccount(exchangeAccount);

            bankAccount.Balance += commission;
            _accountRepository.UpdateAccount(bankAccount);

            var currentExchangeRate = _exchangeRateRepository.GetLatestExchangeRate();

            var tryTransaction = new Transaction
            {
                AccountId = dto.FromAccountId,
                TargetAccountId = dto.ToAccountId,
                Amount = -totalAmount,
                BalanceAfter = tryAccount.Balance,
                TransactionType = (int)TransactionType.ExchangeBuy,
                Description = $"Döviz Alış - {GetCurrencyString(exchangeAccount.CurrencyType)} ({dto.AmountForeign:F2}) - Komisyon: {commission:F2} TRY",
                TransactionDate = DateTime.UtcNow,
                ExchangeRateId = currentExchangeRate?.ExchangeRateId,
                Fee = commission,
                FeeInTRY = commission
            };
            _transactionRepository.AddTransaction(tryTransaction);

            var exchangeTransaction = new Transaction
            {
                AccountId = dto.ToAccountId,
                TargetAccountId = dto.FromAccountId,
                Amount = dto.AmountForeign,
                BalanceAfter = exchangeAccount.Balance,
                TransactionType = (int)TransactionType.ExchangeDeposit,
                Description = $"Döviz Alış - TRY ({dto.AmountTRY:F2}) - Kur: {dto.Rate:F4}",
                TransactionDate = DateTime.UtcNow,
                ExchangeRateId = currentExchangeRate?.ExchangeRateId,
                Fee = 0,
                FeeInTRY = 0
            };
            _transactionRepository.AddTransaction(exchangeTransaction);

            // Banka için fee transaction'ı oluştur
            var bankFeeTx = AddTransaction(bankAccount.AccountId, dto.FromAccountId, commission, 0, (int)TransactionType.Fee, $"Döviz Alış Komisyonu - Hesap {dto.FromAccountId}", bankAccount.Balance, commission, currentExchangeRate?.ExchangeRateId);

            _balanceHistoryService.RecordBalanceChange(dto.FromAccountId, tryAccount.Balance + totalAmount, tryAccount.Balance, -totalAmount, "Döviz Alış - TRY Çıkış", "Döviz Alış - TRY Çıkış", tryTransaction.TransactionId);
            _balanceHistoryService.RecordBalanceChange(dto.ToAccountId, exchangeAccount.Balance - dto.AmountForeign, exchangeAccount.Balance, dto.AmountForeign, "Döviz Alış - Döviz Giriş", "Döviz Alış - Döviz Giriş", exchangeTransaction.TransactionId);
            _balanceHistoryService.RecordBalanceChange(bankAccount.AccountId, bankAccount.Balance - commission, bankAccount.Balance, commission, "Döviz Alış Komisyonu", $"Döviz Alış Komisyonu - Hesap {dto.FromAccountId}", bankFeeTx.TransactionId);

            return Task.FromResult(tryTransaction);
        }

        public Task<Transaction> ExchangeSellAsync(ExchangeSellDTO dto)
        {
            var exchangeAccount = GetActiveAccount(dto.FromAccountId);
            if (exchangeAccount.CurrencyType == CurrencyType.TRY)
                throw new Exception("Kaynak hesap döviz hesabı olmalıdır.");

            var tryAccount = GetActiveAccount(dto.ToAccountId);
            if (tryAccount.CurrencyType != CurrencyType.TRY)
                throw new Exception("Hedef hesap TRY hesabı olmalıdır.");

            if (exchangeAccount.UserId != tryAccount.UserId)
                throw new Exception("Hesaplar aynı kullanıcıya ait olmalıdır.");

            if (exchangeAccount.Balance < dto.AmountForeign)
                throw new Exception("Döviz hesabında yeterli bakiye bulunmuyor.");

            var commission = dto.AmountTRY * 0.005m;
            var netAmount = dto.AmountTRY - commission;

            var bankAccount = GetBankAccount();

            exchangeAccount.Balance -= dto.AmountForeign;
            _accountRepository.UpdateAccount(exchangeAccount);

            tryAccount.Balance += netAmount;
            _accountRepository.UpdateAccount(tryAccount);

            bankAccount.Balance += commission;
            _accountRepository.UpdateAccount(bankAccount);

            // Mevcut günlük kur bilgisini al
            var currentExchangeRate = _exchangeRateRepository.GetLatestExchangeRate();

            var exchangeTransaction = new Transaction
            {
                AccountId = dto.FromAccountId,
                TargetAccountId = dto.ToAccountId,
                Amount = -dto.AmountForeign,
                BalanceAfter = exchangeAccount.Balance,
                TransactionType = (int)TransactionType.ExchangeWithdraw,
                Description = $"Döviz Satış - TRY ({dto.AmountTRY:F2}) - Kur: {dto.Rate:F4}",
                TransactionDate = DateTime.UtcNow,
                ExchangeRateId = currentExchangeRate?.ExchangeRateId,
                Fee = 0,
                FeeInTRY = 0
            };
            _transactionRepository.AddTransaction(exchangeTransaction);

            var tryTransaction = new Transaction
            {
                AccountId = dto.ToAccountId,
                TargetAccountId = dto.FromAccountId,
                Amount = netAmount,
                BalanceAfter = tryAccount.Balance,
                TransactionType = (int)TransactionType.ExchangeSell,
                Description = $"Döviz Satış - {GetCurrencyString(exchangeAccount.CurrencyType)} ({dto.AmountForeign:F2}) - Komisyon: {commission:F2} TRY",
                TransactionDate = DateTime.UtcNow,
                ExchangeRateId = currentExchangeRate?.ExchangeRateId,
                Fee = commission,
                FeeInTRY = commission
            };
            _transactionRepository.AddTransaction(tryTransaction);

            // Banka için fee transaction'ı oluştur
            var bankFeeTx2 = AddTransaction(bankAccount.AccountId, dto.ToAccountId, commission, 0, (int)TransactionType.Fee, $"Döviz Satış Komisyonu - Hesap {dto.FromAccountId}", bankAccount.Balance, commission, currentExchangeRate?.ExchangeRateId);

            _balanceHistoryService.RecordBalanceChange(dto.FromAccountId, exchangeAccount.Balance + dto.AmountForeign, exchangeAccount.Balance, -dto.AmountForeign, "Döviz Satış - Döviz Çıkış", "Döviz Satış - Döviz Çıkış", exchangeTransaction.TransactionId);
            _balanceHistoryService.RecordBalanceChange(dto.ToAccountId, tryAccount.Balance - netAmount, tryAccount.Balance, netAmount, "Döviz Satış - TRY Giriş", "Döviz Satış - TRY Giriş", tryTransaction.TransactionId);
            _balanceHistoryService.RecordBalanceChange(bankAccount.AccountId, bankAccount.Balance - commission, bankAccount.Balance, commission, "Döviz Satış Komisyonu", $"Döviz Satış Komisyonu - Hesap {dto.FromAccountId}", bankFeeTx2.TransactionId);

            return Task.FromResult(tryTransaction);
        }
    }
}
