using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using BankProject.Entities.Enums;

namespace BankProject.Business.Concrete
{
    public class TransactionManager : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepo;
        private readonly IAccountRepository _accountRepo;

        public TransactionManager(ITransactionRepository transactionRepo, IAccountRepository accountRepo)
        {
            _transactionRepo = transactionRepo;
            _accountRepo = accountRepo;
        }

        public Transaction CreateTransaction(Transaction transaction)
        {
            return _transactionRepo.AddTransaction(transaction);
        }

        public List<Transaction> GetTransactionsByAccountId(int accountId)
        {
            return _transactionRepo.GetTransactionsByAccountId(accountId);
        }

        public bool Transfer(TransferDTO dto)
        {
            var fromAccount = _accountRepo.GetAccountById(dto.FromAccountId);
            var toAccount = _accountRepo.GetAccountById(dto.ToAccountId);

            if (fromAccount == null || toAccount == null)
                throw new Exception("Hesap bulunamadı.");

            if (fromAccount.Balance < dto.Amount)
                throw new Exception("Yetersiz bakiye.");

            fromAccount.Balance -= dto.Amount;
            toAccount.Balance += dto.Amount;

            _accountRepo.UpdateAccount(fromAccount);
            _accountRepo.UpdateAccount(toAccount);

            _transactionRepo.AddTransaction(new Transaction
            {
                AccountId = fromAccount.AccountId,
                TransactionType = TransactionType.Transfer,
                Amount = dto.Amount,
                TransactionDate = DateTime.UtcNow,
                Description = $"Transfer to account {toAccount.AccountId}",
                TargetAccountId = toAccount.AccountId
            });

            _transactionRepo.AddTransaction(new Transaction
            {
                AccountId = toAccount.AccountId,
                TransactionType = TransactionType.Deposit,
                Amount = dto.Amount,
                TransactionDate = DateTime.UtcNow,
                Description = $"Transfer from account {fromAccount.AccountId}",
                TargetAccountId = fromAccount.AccountId
            });

            return true;
        }

        public bool Deposit(int accountId, decimal amount, string description = "")
        {
            var account = _accountRepo.GetAccountById(accountId);
            if (account == null)
                throw new Exception("Hesap bulunamadı.");

            account.Balance += amount;
            _accountRepo.UpdateAccount(account);

            _transactionRepo.AddTransaction(new Transaction
            {
                AccountId = account.AccountId,
                TransactionType = TransactionType.Deposit,
                Amount = amount,
                TransactionDate = DateTime.UtcNow,
                Description = description
            });

            return true;
        }

        public bool Withdraw(int accountId, decimal amount, string description = "")
        {
            var account = _accountRepo.GetAccountById(accountId);
            if (account == null)
                throw new Exception("Hesap bulunamadı.");

            if (account.Balance < amount)
                throw new Exception("Yetersiz bakiye.");

            account.Balance -= amount;
            _accountRepo.UpdateAccount(account);

            _transactionRepo.AddTransaction(new Transaction
            {
                AccountId = account.AccountId,
                TransactionType = TransactionType.Withdraw,
                Amount = amount,
                TransactionDate = DateTime.UtcNow,
                Description = description
            });

            return true;
        }
    }
}
