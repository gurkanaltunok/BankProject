using BankProject.Entities;
using BankProject.Business.DTOs;
using System;
using System.Collections.Generic;

namespace BankProject.Business.Abstract
{
    public interface ITransactionService
    {
        Transaction Deposit(int accountId, decimal amount, string description);
        Transaction Withdraw(int accountId, decimal amount, string description);
        TransactionDTO Transfer(int fromAccountId, int toAccountId, decimal amount, string description);
        List<Transaction> GetTransactionsByAccountId(int accountId);
        List<Transaction> GetTransactionsByDateRange(DateTime? startDate, DateTime? endDate, int? accountId);
        bool CheckAccountOwner(int accountId, int userId);
    }
}
