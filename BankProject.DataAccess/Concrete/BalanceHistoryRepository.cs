using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using System.Collections.Generic;
using System.Linq;

namespace BankProject.DataAccess.Concrete
{
    public class BalanceHistoryRepository : IBalanceHistoryRepository
    {
        private readonly BankDbContext _context;

        public BalanceHistoryRepository(BankDbContext context)
        {
            _context = context;
        }

        public void AddBalanceHistory(BalanceHistory balanceHistory)
        {
            _context.BalanceHistories.Add(balanceHistory);
            _context.SaveChanges();
        }

        public List<BalanceHistory> GetBalanceHistoryByAccount(int accountId)
        {
            return _context.BalanceHistories
                .Where(b => b.AccountId == accountId)
                .OrderByDescending(b => b.Date)
                .ToList();
        }

        public List<BalanceHistory> GetBalanceHistoryByAccountAndDateRange(int accountId, System.DateTime startDate, System.DateTime endDate)
        {
            return _context.BalanceHistories
                .Where(b => b.AccountId == accountId && b.Date >= startDate && b.Date <= endDate)
                .OrderByDescending(b => b.Date)
                .ToList();
        }

        public BalanceHistory GetLatestBalanceHistory(int accountId)
        {
            return _context.BalanceHistories
                .Where(b => b.AccountId == accountId)
                .OrderByDescending(b => b.Date)
                .FirstOrDefault();
        }
    }
}
