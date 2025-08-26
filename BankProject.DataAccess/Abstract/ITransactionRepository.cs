using BankProject.Entities;
using System.Collections.Generic;

namespace BankProject.DataAccess.Abstract
{
    public interface ITransactionRepository
    {
        Transaction AddTransaction(Transaction transaction);
        List<Transaction> GetTransactionsByAccountId(int accountId);
    }
}
