using System;
using System.Collections.Generic;
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

        public TransactionManager(ITransactionRepository transactionRepository, IAccountRepository accountRepository, IBalanceHistoryService balanceHistoryService)
        {
            _transactionRepository = transactionRepository;
            _accountRepository = accountRepository;
            _balanceHistoryService = balanceHistoryService;
        }

        private Account GetActiveAccount(int accountId)
        {
            var account = _accountRepository.GetAccountById(accountId);
            if (account == null || !account.IsActive)
                throw new Exception("Hesap bulunamadı veya aktif değil.");
            return account;
        }

        private Account GetBankAccount() => GetActiveAccount(1); // Banka AccountId = 1

        private Transaction AddTransaction(int accountId, int? targetAccountId, decimal amount, decimal fee, int type, string description, decimal? balanceAfter = null)
        {
            var transaction = new Transaction
            {
                AccountId = accountId,
                TargetAccountId = targetAccountId,
                Amount = amount,
                Fee = fee,
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

        // Withdraw - Fee %2
        public TransactionDTO Withdraw(int accountId, decimal amount, string description)
        {
            var account = GetActiveAccount(accountId);
            var bank = GetBankAccount();

            decimal fee = amount * 0.02m;
            decimal totalDebit = amount + fee;

            if (account.Balance < totalDebit)
                throw new Exception("Yetersiz bakiye.");

            var previousBalance = account.Balance;
            var bankPreviousBalance = bank.Balance;
            
            account.Balance -= totalDebit;
            bank.Balance += fee;

            _accountRepository.UpdateAccount(account);
            _accountRepository.UpdateAccount(bank);

            var withdrawTransaction = AddTransaction(accountId, null, amount, fee, (int)TransactionType.Withdraw, description, account.Balance);
            var feeTransaction = AddTransaction(bank.AccountId, accountId, fee, 0, (int)TransactionType.Fee, $"İşlem Ücreti - Hesap {accountId}", bank.Balance);
            
            // Bakiye geçmişini kaydet
            _balanceHistoryService.RecordBalanceChange(accountId, previousBalance, account.Balance, -totalDebit, "Withdraw", description, withdrawTransaction.TransactionId);
            _balanceHistoryService.RecordBalanceChange(bank.AccountId, bankPreviousBalance, bank.Balance, fee, "Fee", $"İşlem Ücreti - Hesap {accountId}", feeTransaction.TransactionId);

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

        // Transfer - Fee %2
        public TransactionDTO Transfer(int fromAccountId, int toAccountId, decimal amount, string description)
        {
            var fromAccount = GetActiveAccount(fromAccountId);
            var toAccount = GetActiveAccount(toAccountId);
            var bank = GetBankAccount();

            // Currency type kontrolü - aynı para biriminde olmalı
            Console.WriteLine($"DEBUG: FromAccount CurrencyType: {fromAccount.CurrencyType}, ToAccount CurrencyType: {toAccount.CurrencyType}");
            if (fromAccount.CurrencyType != toAccount.CurrencyType)
                throw new Exception($"Farklı para birimlerinden transfer yapılamaz. Gönderen hesap: {fromAccount.CurrencyType}, Alıcı hesap: {toAccount.CurrencyType}");

            decimal fee = amount * 0.02m;
            decimal totalDebit = amount + fee;

            if (fromAccount.Balance < totalDebit)
                throw new Exception("Yetersiz bakiye.");

            fromAccount.Balance -= totalDebit;
            toAccount.Balance += amount;
            bank.Balance += fee;

            _accountRepository.UpdateAccount(fromAccount);
            _accountRepository.UpdateAccount(toAccount);
            _accountRepository.UpdateAccount(bank);

            var transferTransaction = new Transaction
            {
                AccountId = fromAccountId,
                TargetAccountId = toAccountId,
                Amount = amount,
                Fee = fee,
                TransactionType = (int)TransactionType.Transfer,
                Description = description,
                TransactionDate = DateTime.UtcNow,
                BalanceAfter = fromAccount.Balance
            };

            var createdTransaction = _transactionRepository.AddTransaction(transferTransaction);

            // Banka için fee transaction
            AddTransaction(bank.AccountId, fromAccountId, fee, 0, (int)TransactionType.Fee, $"İşlem Ücreti - Hesap {fromAccountId}");

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
