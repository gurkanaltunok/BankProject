using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;

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
            // Hesabın kendi işlemleri + sadece transferlerde hedef olduğu işlemler
            return _context.Transactions
                           .Include(t => t.ExchangeRate)
                           .Where(t => t.AccountId == accountId || (t.TargetAccountId == accountId && t.TransactionType == 3))
                           .OrderByDescending(t => t.TransactionDate)
                           .ToList();
        }

         public List<Transaction> GetTransactionsByDateRange(DateTime? startDate, DateTime? endDate, int? accountId, int? userId = null)
        {
            var query = _context.Transactions.AsQueryable();

            if (accountId.HasValue)
            {
                query = query.Where(t => t.AccountId == accountId.Value || t.TargetAccountId == accountId.Value);
            }
            else if (userId.HasValue)
            {
                // Eğer accountId verilmemişse ama userId verilmişse o kullanıcının tüm hesaplarının işlemlerini getir
                var userAccountIds = _context.Accounts
                    .Where(a => a.UserId == userId.Value && a.IsActive)
                    .Select(a => a.AccountId)
                    .ToList();
                
                query = query.Where(t => userAccountIds.Contains(t.AccountId) || userAccountIds.Contains(t.TargetAccountId ?? 0));
            }

            if (startDate.HasValue)
            {
                query = query.Where(t => t.TransactionDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(t => t.TransactionDate <= endDate.Value);
            }

            return query.Include(t => t.ExchangeRate).OrderByDescending(t => t.TransactionDate).ToList();
        }
    }
}
