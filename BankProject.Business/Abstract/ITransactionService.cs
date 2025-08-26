using BankProject.Business.DTOs;
using BankProject.Entities;
using System.Collections.Generic;

namespace BankProject.Business.Abstract
{
    public interface ITransactionService
    {
        Transaction CreateTransaction(Transaction transaction);
        List<Transaction> GetTransactionsByAccountId(int accountId);

        bool Deposit(int accountId, decimal amount, string description = "");
        bool Withdraw(int accountId, decimal amount, string description = "");
        bool Transfer(TransferDTO transferDto);
    }
}
