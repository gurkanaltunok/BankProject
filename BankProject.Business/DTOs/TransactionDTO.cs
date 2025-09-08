using BankProject.Entities.Enums;
using System;

namespace BankProject.Business.DTOs
{
    public class TransactionDTO
    {
        public int TransactionId { get; set; }
        public int AccountId { get; set; }
        public int? TargetAccountId { get; set; }
        public decimal Amount { get; set; }
        public decimal Fee { get; set; }
        public int TransactionType { get; set; }
        public string? Description { get; set; }
        public DateTime TransactionDate { get; set; }
        public decimal BalanceAfter { get; set; }
    }
}
