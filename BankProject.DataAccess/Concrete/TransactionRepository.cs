using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using System.Collections.Generic;
using System.Linq;

namespace BankProject.DataAccess.Concrete
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly BankDbContext _context;

        public TransactionRepository(BankDbContext context)
        {
            _context = context;
        }

        public Transaction AddTransaction(Transaction transaction)
        {
            _context.Transactions.Add(transaction);
            _context.SaveChanges();
            return transaction;
        }

        public List<Transaction> GetTransactionsByAccountId(int accountId)
        {
            return _context.Transactions
                           .Where(t => t.AccountId == accountId)
                           .ToList();
        }

         public List<Transaction> GetTransactionsByDateRange(DateTime? startDate, DateTime? endDate, int? accountId)
        {
            var query = _context.Transactions.AsQueryable();

            if (accountId.HasValue)
            {
                query = query.Where(t => t.AccountId == accountId.Value || t.TargetAccountId == accountId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(t => t.TransactionDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(t => t.TransactionDate <= endDate.Value);
            }

            return query.OrderByDescending(t => t.TransactionDate).ToList();
        }
    }
}
