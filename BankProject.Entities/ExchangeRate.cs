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
        public string Currency { get; set; } = string.Empty; // USD, EUR, GBP

        [Required, Precision(18, 6)]
        public decimal Rate { get; set; } // 1 Currency = Rate TRY

        [Required]
        public DateTime Date { get; set; } = DateTime.UtcNow;

        // Navigation property removed to prevent circular reference
    }
}
