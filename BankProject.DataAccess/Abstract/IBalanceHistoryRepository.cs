using BankProject.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BankProject.DataAccess.Abstract
{
    public interface IBalanceHistoryRepository
    {
        void AddBalanceHistory(BalanceHistory balanceHistory);
        List<BalanceHistory> GetBalanceHistoryByAccount(int accountId);
        List<BalanceHistory> GetBalanceHistoryByAccountAndDateRange(int accountId, System.DateTime startDate, System.DateTime endDate);
        BalanceHistory GetLatestBalanceHistory(int accountId);
    }
}
