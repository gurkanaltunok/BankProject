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

        public TransactionManager(ITransactionRepository transactionRepository, IAccountRepository accountRepository)
        {
            _transactionRepository = transactionRepository;
            _accountRepository = accountRepository;
        }

        private Account GetActiveAccount(int accountId)
        {
            var account = _accountRepository.GetAccountById(accountId);
            if (account == null || !account.IsActive)
                throw new Exception("Hesap bulunamadı veya aktif değil.");
            return account;
        }

        private Account GetBankAccount() => GetActiveAccount(1); // Banka AccountId = 1

        private Transaction AddTransaction(int accountId, int? targetAccountId, decimal amount, decimal fee, TransactionType type, string description)
        {
            var transaction = new Transaction
            {
                AccountId = accountId,
                TargetAccountId = targetAccountId,
                Amount = amount,
                Fee = fee,
                TransactionType = type,
                Description = description,
                TransactionDate = DateTime.UtcNow
            };

            return _transactionRepository.AddTransaction(transaction);
        }

        // Deposit - No Fee
        public Transaction Deposit(int accountId, decimal amount, string description)
        {
            var account = GetActiveAccount(accountId);
            account.Balance += amount;
            _accountRepository.UpdateAccount(account);

            return AddTransaction(accountId, null, amount, 0, TransactionType.Deposit, description);
        }

        // Withdraw - Fee %2
        public Transaction Withdraw(int accountId, decimal amount, string description)
        {
            var account = GetActiveAccount(accountId);
            var bank = GetBankAccount();

            decimal fee = amount * 0.02m;
            decimal totalDebit = amount + fee;

            if (account.Balance < totalDebit)
                throw new Exception("Yetersiz bakiye.");

            account.Balance -= totalDebit;
            bank.Balance += fee;

            _accountRepository.UpdateAccount(account);
            _accountRepository.UpdateAccount(bank);

            var withdrawTransaction = AddTransaction(accountId, null, amount, fee, TransactionType.Withdraw, description);
            AddTransaction(bank.AccountId, accountId, fee, 0, TransactionType.Deposit, $"İşlem Ücreti - Hesap {accountId}");

            return withdrawTransaction;
        }

        // Transfer - Fee %2
        public TransactionDTO Transfer(int fromAccountId, int toAccountId, decimal amount, string description)
        {
            var fromAccount = GetActiveAccount(fromAccountId);
            var toAccount = GetActiveAccount(toAccountId);
            var bank = GetBankAccount();

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
                TransactionType = TransactionType.Transfer,
                Description = description,
                TransactionDate = DateTime.UtcNow
            };

            var createdTransaction = _transactionRepository.AddTransaction(transferTransaction);

            // Banka için fee transaction
            AddTransaction(bank.AccountId, fromAccountId, fee, 0, TransactionType.Deposit, $"İşlem Ücreti - Hesap {fromAccountId}");

            return new TransactionDTO
            {
                TransactionId = createdTransaction.TransactionId,
                AccountId = createdTransaction.AccountId,
                TargetAccountId = createdTransaction.TargetAccountId,
                Amount = createdTransaction.Amount,
                Fee = createdTransaction.Fee ?? 0,
                Description = createdTransaction.Description,
                TransactionDate = createdTransaction.TransactionDate,
                TransactionType = createdTransaction.TransactionType
            };
        }



        public List<Transaction> GetTransactionsByAccountId(int accountId)
            => _transactionRepository.GetTransactionsByAccountId(accountId);

        public List<Transaction> GetTransactionsByDateRange(DateTime? startDate, DateTime? endDate, int? accountId)
            => _transactionRepository.GetTransactionsByDateRange(startDate, endDate, accountId);

        public bool CheckAccountOwner(int accountId, int userId)
        {
            var account = _accountRepository.GetAccountById(accountId);
            if (account == null)
                throw new Exception("Hesap bulunamadı.");
            return account.UserId == userId;
        }
    }
}
