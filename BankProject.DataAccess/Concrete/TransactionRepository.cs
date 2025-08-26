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
    }
}
