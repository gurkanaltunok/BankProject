using System;

namespace BankProject.Entities
{
    public class BalanceHistory
    {
        public int Id { get; set; }
        public int AccountId { get; set; }
        public decimal Balance { get; set; }
        public decimal PreviousBalance { get; set; }
        public decimal ChangeAmount { get; set; }
        public string ChangeType { get; set; } // "Deposit", "Withdraw", "Transfer", "Fee"
        public string Description { get; set; }
        public DateTime Date { get; set; }
        public int? TransactionId { get; set; } // İlgili işlem ID'si (opsiyonel)
        
        // Navigation properties
        public Account Account { get; set; }
        public Transaction Transaction { get; set; }
    }
}
