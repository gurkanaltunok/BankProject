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

        private async Task<(decimal rate, int exchangeRateId)> GetCurrentExchangeRateAsync(string fromCurrency, string toCurrency)
        {
            decimal rate = 1.0m;
            int exchangeRateId = 0;

            try
            {
                var response = await _httpClient.GetStringAsync("https://api.exchangerate-api.com/v4/latest/TRY");
                var jsonDoc = JsonDocument.Parse(response);
                
                if (jsonDoc.RootElement.TryGetProperty("rates", out var ratesElement))
                {
                    if (fromCurrency == "TRY")
                    {
                        var toRate = ratesElement.GetProperty(toCurrency).GetDecimal();
                        rate = 1.0m / toRate;
                    }
                    else if (toCurrency == "TRY")
                    {
                        var fromRate = ratesElement.GetProperty(fromCurrency).GetDecimal();
                        rate = 1.0m / fromRate;
                    }
                }

                // ExchangeRate tablosuna kaydet
                var exchangeRate = new ExchangeRate
                {
                    FromCurrency = fromCurrency,
                    ToCurrency = toCurrency,
                    Rate = rate,
                    Date = DateTime.UtcNow,
                    Source = "exchangerate-api.com"
                };

                var savedExchangeRate = _exchangeRateRepository.AddExchangeRate(exchangeRate);
                exchangeRateId = savedExchangeRate.ExchangeRateId;

                Console.WriteLine($"DEBUG: ExchangeRate saved - {fromCurrency} to {toCurrency}: {rate} (ID: {exchangeRateId})");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exchange rate API error: {ex.Message}");
                
                // Fallback rates
                var fallbackRates = new Dictionary<string, decimal>
                {
                    { "TRY", 1.0m },
                    { "USD", 41.32m },
                    { "EUR", 44.85m },
                    { "GBP", 52.48m }
                };

                if (fallbackRates.ContainsKey(fromCurrency) && fallbackRates.ContainsKey(toCurrency))
                {
                    rate = fallbackRates[toCurrency] / fallbackRates[fromCurrency];
                }

                // Fallback rate'i de kaydet
                var fallbackExchangeRate = new ExchangeRate
                {
                    FromCurrency = fromCurrency,
                    ToCurrency = toCurrency,
                    Rate = rate,
                    Date = DateTime.UtcNow,
                    Source = "fallback"
                };

                var savedFallbackRate = _exchangeRateRepository.AddExchangeRate(fallbackExchangeRate);
                exchangeRateId = savedFallbackRate.ExchangeRateId;
            }

            return (rate, exchangeRateId);
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

        // Deposit - No Fee
        public TransactionDTO Deposit(int accountId, decimal amount, string description)
        {
            var account = GetActiveAccount(accountId);
            var previousBalance = account.Balance;
            account.Balance += amount;
            _accountRepository.UpdateAccount(account);

            var transaction = AddTransaction(accountId, null, amount, 0, (int)TransactionType.Deposit, description, account.Balance);
            
            // Bakiye geçmişini kaydet
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

        // Withdraw - Fee %0.5
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
            
            // Fee'yi TL'ye çevir (eğer hesap TL değilse)
            decimal feeInTRY = fee;
            int? exchangeRateId = null;
            if (account.CurrencyType != CurrencyType.TRY)
            {
                var accountCurrency = GetCurrencyString(account.CurrencyType);
                var (rate, rateId) = GetCurrentExchangeRateAsync(accountCurrency, "TRY").Result;
                feeInTRY = fee * rate;
                exchangeRateId = rateId;
                Console.WriteLine($"DEBUG: Withdraw - {fee} {accountCurrency} fee = {feeInTRY} TL (güncel kur: {rate}, ExchangeRateId: {rateId})");
            }
            
            account.Balance -= totalDebit;
            bank.Balance += feeInTRY;

            _accountRepository.UpdateAccount(account);
            _accountRepository.UpdateAccount(bank);

            var withdrawTransaction = AddTransaction(accountId, null, amount, fee, (int)TransactionType.Withdraw, description, account.Balance, feeInTRY, exchangeRateId);
            var feeTransaction = AddTransaction(bank.AccountId, accountId, feeInTRY, 0, (int)TransactionType.Fee, $"İşlem Ücreti - Hesap {accountId}", bank.Balance);
            
            // Bakiye geçmişini kaydet
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

        // Transfer - Fee %0.5
        public TransactionDTO Transfer(int fromAccountId, int toAccountId, decimal amount, string description)
        {
            var fromAccount = GetActiveAccount(fromAccountId);
            var toAccount = GetActiveAccount(toAccountId);
            var bank = GetBankAccount();

            // Currency type kontrolü - aynı para biriminde olmalı
            Console.WriteLine($"DEBUG: FromAccount CurrencyType: {fromAccount.CurrencyType}, ToAccount CurrencyType: {toAccount.CurrencyType}");
            if (fromAccount.CurrencyType != toAccount.CurrencyType)
                throw new Exception($"Farklı para birimlerinden transfer yapılamaz. Gönderen hesap: {fromAccount.CurrencyType}, Alıcı hesap: {toAccount.CurrencyType}");

            decimal fee = amount * 0.005m;
            decimal totalDebit = amount + fee;

            if (fromAccount.Balance < totalDebit)
                throw new Exception("Yetersiz bakiye.");

            // Fee'yi TL'ye çevir (eğer hesap TL değilse)
            decimal feeInTRY = fee;
            int? exchangeRateId = null;
            if (fromAccount.CurrencyType != CurrencyType.TRY)
            {
                var accountCurrency = GetCurrencyString(fromAccount.CurrencyType);
                var (rate, rateId) = GetCurrentExchangeRateAsync(accountCurrency, "TRY").Result;
                feeInTRY = fee * rate;
                exchangeRateId = rateId;
                Console.WriteLine($"DEBUG: Transfer - {fee} {accountCurrency} fee = {feeInTRY} TL (güncel kur: {rate}, ExchangeRateId: {rateId})");
            }

            fromAccount.Balance -= totalDebit;
            toAccount.Balance += amount;
            bank.Balance += feeInTRY;

            _accountRepository.UpdateAccount(fromAccount);
            _accountRepository.UpdateAccount(toAccount);
            _accountRepository.UpdateAccount(bank);

            var createdTransaction = AddTransaction(fromAccountId, toAccountId, amount, fee, (int)TransactionType.Transfer, description, fromAccount.Balance, feeInTRY, exchangeRateId);

            // Banka için fee transaction
            AddTransaction(bank.AccountId, fromAccountId, feeInTRY, 0, (int)TransactionType.Fee, $"İşlem Ücreti - Hesap {fromAccountId}", bank.Balance);

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
            => _transactionRepository.GetTransactionsByAccountId(accountId);

        public List<Transaction> GetTransactionsByDateRange(DateTime? startDate, DateTime? endDate, int? accountId, int? userId = null)
            => _transactionRepository.GetTransactionsByDateRange(startDate, endDate, accountId, userId);

        public bool CheckAccountOwner(int accountId, int userId)
        {
            var account = _accountRepository.GetAccountById(accountId);
            if (account == null)
                throw new Exception("Hesap bulunamadı.");
            return account.UserId == userId;
        }
    }
}
