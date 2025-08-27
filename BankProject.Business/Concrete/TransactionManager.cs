using BankProject.Business.Abstract;
using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using BankProject.Entities.Enums;
using System;
using System.Collections.Generic;

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
                throw new Exception("Hesap bulunamadı");

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
            if (account == null || !account.IsActive)
                throw new Exception("Hesap bulunamadı");
            if (account.Balance < amount)
                throw new Exception("Yetersiz bakiye");

            account.Balance -= amount;
            _accountRepository.UpdateAccount(account);

            var transaction = new Transaction
            {
                AccountId = accountId,
                Amount = amount,
                Description = description,
                TransactionType = TransactionType.Withdraw,
                TransactionDate = DateTime.UtcNow
            };

            return _transactionRepository.AddTransaction(transaction);
        }

        public Transaction Transfer(int fromAccountId, int toAccountId, decimal amount, string description)
        {
            var fromAccount = _accountRepository.GetAccountById(fromAccountId);
            var toAccount = _accountRepository.GetAccountById(toAccountId);

            if (fromAccount == null || toAccount == null)
                throw new Exception("Hesap bulunamadı");

            if (!fromAccount.IsActive || !toAccount.IsActive)
                throw new Exception("Alıcı veya gönderici hesap aktif değil");

            if (fromAccount.CurrencyType != toAccount.CurrencyType ||
                fromAccount.AccountType != toAccount.AccountType)
                throw new Exception("Alıcı hesap tipi uyuşmadı");

            if (fromAccount.Balance < amount)
                throw new Exception("Yetersiz bakiye");

            fromAccount.Balance -= amount;
            toAccount.Balance += amount;

            var transaction = new Transaction
            {
                TransactionType = TransactionType.Transfer,
                Amount = amount,
                AccountId = fromAccountId,
                TargetAccountId = toAccountId,
                Description = description,
                TransactionDate = DateTime.UtcNow
            };

            _accountRepository.UpdateAccount(fromAccount);
            _accountRepository.UpdateAccount(toAccount);
            _transactionRepository.AddTransaction(transaction);

            return transaction;
        }

        public List<Transaction> GetTransactionsByAccountId(int accountId)
        {
            return _transactionRepository.GetTransactionsByAccountId(accountId);
        }
    }
}
