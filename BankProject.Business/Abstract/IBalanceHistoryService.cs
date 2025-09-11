using BankProject.Entities;
using System.Collections.Generic;

namespace BankProject.Business.Abstract
{
    public interface IBalanceHistoryService
    {
        void RecordBalanceChange(int accountId, decimal previousBalance, decimal newBalance, decimal changeAmount, string changeType, string description, int? transactionId = null);
        List<BalanceHistory> GetBalanceHistoryByAccount(int accountId);
        List<BalanceHistory> GetBalanceHistoryByAccountAndDateRange(int accountId, System.DateTime startDate, System.DateTime endDate);
    }
}
