using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BankProject.Entities
{
    public class ExchangeRate
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ExchangeRateId { get; set; }

        [Required, MaxLength(3)]
        public string FromCurrency { get; set; } = string.Empty; // USD, EUR, GBP

        [Required, MaxLength(3)]
        public string ToCurrency { get; set; } = string.Empty; // TRY

        [Required, Precision(18, 6)]
        public decimal Rate { get; set; }

        [Required]
        public DateTime Date { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string? Source { get; set; } // API kaynağı

        // Navigation property
        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}
