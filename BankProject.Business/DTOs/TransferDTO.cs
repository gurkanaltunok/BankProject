    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    using System.ComponentModel.DataAnnotations;

    namespace BankProject.Business.DTOs
    {
        public class TransferDTO
        {
            [Required]
            public int FromAccountId { get; set; }

            [Required]
            public int ToAccountId { get; set; }

            [Required, Range(1, double.MaxValue, ErrorMessage = "Miktar sıfırdan büyük olmalı.")]
            public decimal Amount { get; set; }

            public string Description { get; set; } = string.Empty;
        }
    }

