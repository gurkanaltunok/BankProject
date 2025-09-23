using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BankProject.Entities
{
    public class ExchangeRate
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ExchangeRateId { get; set; }

        [Required]
        public DateTime Date { get; set; } = DateTime.UtcNow;

        [Required, Precision(18, 6)]
        public decimal UsdRate { get; set; } // 1 USD = UsdRate TRY

        [Required, Precision(18, 6)]
        public decimal EurRate { get; set; } // 1 EUR = EurRate TRY

        [Required, Precision(18, 6)]
        public decimal GbpRate { get; set; } // 1 GBP = GbpRate TRY

        // Navigation property removed to prevent circular reference
    }
}
