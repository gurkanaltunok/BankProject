using System;
using System.Collections.Generic;
using BankProject.Business.Abstract;
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

        public Transaction Deposit(int accountId, decimal amount, string description)
        {
            var account = _accountRepository.GetAccountById(accountId);
            if (account == null || !account.IsActive)
                throw new Exception("Hesap bulunamadı.");

            account.Balance += amount;
            _accountRepository.UpdateAccount(account);

            var transaction = new Transaction
            {
                AccountId = accountId,
                Amount = amount,
                Description = description,
                TransactionType = TransactionType.Deposit,
                TransactionDate = DateTime.UtcNow
            };

            return _transactionRepository.AddTransaction(transaction);
        }

        public Transaction Withdraw(int accountId, decimal amount, string description)
        {
            var account = _accountRepository.GetAccountById(accountId);
            var bankAccount = _accountRepository.GetAccountById(1); // Bank account

            if (account == null || !account.IsActive)
                throw new Exception("Hesap bulunamadı.");

            if (bankAccount == null || !bankAccount.IsActive)
                throw new Exception("Banka hesabı bulunamadı.");

            decimal fee = amount * 0.02m;
            decimal totalDebit = amount + fee;

            if (account.Balance < totalDebit)
                throw new Exception("Yetersiz bakiye.");

            account.Balance -= totalDebit;
            bankAccount.Balance += fee;

            _accountRepository.UpdateAccount(account);
            _accountRepository.UpdateAccount(bankAccount);

            var withdrawTransaction = new Transaction
            {
                AccountId = accountId,
                Amount = amount,
                Fee = fee,
                Description = description,
                TransactionType = TransactionType.Withdraw,
                TransactionDate = DateTime.UtcNow
            };
            _transactionRepository.AddTransaction(withdrawTransaction);

            var bankFeeTransaction = new Transaction
            {
                AccountId = bankAccount.AccountId,
                Amount = fee,
                Fee = 0,
                Description = $"İşlem Ücreti - Hesap {accountId}",
                TransactionType = TransactionType.Deposit,
                TransactionDate = DateTime.UtcNow,
                TargetAccountId = accountId
            };
            _transactionRepository.AddTransaction(bankFeeTransaction);

            return withdrawTransaction;
        }

        public Transaction Transfer(int fromAccountId, int toAccountId, decimal amount, string description)
        {
            var fromAccount = _accountRepository.GetAccountById(fromAccountId);
            var toAccount = _accountRepository.GetAccountById(toAccountId);
            var bankAccount = _accountRepository.GetAccountById(1); // Bank account

            if (fromAccount == null || toAccount == null || bankAccount == null)
                throw new Exception("Hesap bulunamadı.");

            if (!fromAccount.IsActive || !toAccount.IsActive)
                throw new Exception("Alıcı veya gönderici hesap aktif değil.");

            if (fromAccount.CurrencyType != toAccount.CurrencyType ||
                fromAccount.AccountType != toAccount.AccountType)
                throw new Exception("Alıcı hesap tipi uyuşmadı.");

            decimal fee = amount * 0.02m;
            decimal totalDebit = amount + fee;

            if (fromAccount.Balance < totalDebit)
                throw new Exception("Yetersiz bakiye.");

            fromAccount.Balance -= totalDebit;
            toAccount.Balance += amount;
            bankAccount.Balance += fee;

            _accountRepository.UpdateAccount(fromAccount);
            _accountRepository.UpdateAccount(toAccount);
            _accountRepository.UpdateAccount(bankAccount);

            var transferTransaction = new Transaction
            {
                TransactionType = TransactionType.Transfer,
                Amount = amount,
                Fee = fee,
                AccountId = fromAccountId,
                TargetAccountId = toAccountId,
                Description = description,
                TransactionDate = DateTime.UtcNow
            };
            _transactionRepository.AddTransaction(transferTransaction);

            var bankFeeTransaction = new Transaction
            {
                TransactionType = TransactionType.Deposit,
                Amount = fee,
                Fee = 0,
                AccountId = bankAccount.AccountId,
                TargetAccountId = fromAccountId,
                Description = $"Transfer ücreti: {description}",
                TransactionDate = DateTime.UtcNow
            };
            _transactionRepository.AddTransaction(bankFeeTransaction);

            return transferTransaction;
        }


        public List<Transaction> GetTransactionsByAccountId(int accountId)
        {
            return _transactionRepository.GetTransactionsByAccountId(accountId);
        }

        public List<Transaction> GetTransactionsByDateRange(DateTime? startDate, DateTime? endDate)
        {
            return _transactionRepository.GetByDateRange(startDate, endDate);
        }
    }
}
