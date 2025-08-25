using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BankProject.Entities
{
    public enum TransactionType
    {
        Deposit,
        Withdraw,
        Transfer
    }

    public class Transaction
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TransactionId { get; set; }

        [Required]
        public TransactionType TransactionType { get; set; }

        [Required, Precision(18, 2)]
        public decimal Amount { get; set; }

        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        [ForeignKey("Account")]
        public int AccountId { get; set; }
        public Account? Account { get; set; }

        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        [ForeignKey("TargetAccount")]
        public int? TargetAccountId { get; set; }
        public Account? TargetAccount { get; set; }
    }
}

