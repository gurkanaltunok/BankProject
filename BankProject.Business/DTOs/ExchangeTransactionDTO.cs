using System.ComponentModel.DataAnnotations;

namespace BankProject.Business.DTOs
{
    public class ExchangeBuyDTO
    {
        [Required]
        public int FromAccountId { get; set; } // TRY Hesabı
        
        [Required]
        public int ToAccountId { get; set; } // Döviz Hesabı
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "TRY tutarı 0'dan büyük olmalıdır")]
        public decimal AmountTRY { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Döviz tutarı 0'dan büyük olmalıdır")]
        public decimal AmountForeign { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Kur 0'dan büyük olmalıdır")]
        public decimal Rate { get; set; }
        
        public string? Description { get; set; }
    }

    public class ExchangeSellDTO
    {
        [Required]
        public int FromAccountId { get; set; } // Döviz Hesabı
        
        [Required]
        public int ToAccountId { get; set; } // TRY Hesabı
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Döviz tutarı 0'dan büyük olmalıdır")]
        public decimal AmountForeign { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "TRY tutarı 0'dan büyük olmalıdır")]
        public decimal AmountTRY { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Kur 0'dan büyük olmalıdır")]
        public decimal Rate { get; set; }
        
        public string? Description { get; set; }
    }
}
