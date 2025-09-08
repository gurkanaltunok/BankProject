using System.ComponentModel.DataAnnotations;

namespace BankProject.Business.DTOs
{
    public class DepositWithdrawDTO
    {
        [Required]
        public int AccountId { get; set; }

        [Required, Range(1, double.MaxValue, ErrorMessage = "Miktar sıfırdan büyük olmalı.")]
        public decimal Amount { get; set; }

        public string Description { get; set; } = string.Empty;
    }
}
