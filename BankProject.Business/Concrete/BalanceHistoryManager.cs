using BankProject.Business.Abstract;
using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using System.Collections.Generic;

namespace BankProject.Business.Concrete
{
    public class BalanceHistoryManager : IBalanceHistoryService
    {
        private readonly IBalanceHistoryRepository _balanceHistoryRepository;

        public BalanceHistoryManager(IBalanceHistoryRepository balanceHistoryRepository)
        {
            _balanceHistoryRepository = balanceHistoryRepository;
        }

        public void RecordBalanceChange(int accountId, decimal previousBalance, decimal newBalance, decimal changeAmount, string changeType, string description, int? transactionId = null)
        {
            var balanceHistory = new BalanceHistory
            {
                AccountId = accountId,
                PreviousBalance = previousBalance,
                Balance = newBalance,
                ChangeAmount = changeAmount,
                ChangeType = changeType,
                Description = description,
                Date = System.DateTime.UtcNow,
                TransactionId = transactionId
            };

            _balanceHistoryRepository.AddBalanceHistory(balanceHistory);
        }

        public List<BalanceHistory> GetBalanceHistoryByAccount(int accountId)
        {
            return _balanceHistoryRepository.GetBalanceHistoryByAccount(accountId);
        }

        public List<BalanceHistory> GetBalanceHistoryByAccountAndDateRange(int accountId, System.DateTime startDate, System.DateTime endDate)
        {
            return _balanceHistoryRepository.GetBalanceHistoryByAccountAndDateRange(accountId, startDate, endDate);
        }
    }
}
