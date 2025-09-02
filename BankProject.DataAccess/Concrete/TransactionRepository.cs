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

        public List<Transaction> GetByDateRange(DateTime? startDate, DateTime? endDate)
        {
            var query = _context.Transactions.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(t => t.TransactionDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(t => t.TransactionDate <= endDate.Value);

            return query.OrderByDescending(t => t.TransactionDate).ToList();
        }
    }
}
