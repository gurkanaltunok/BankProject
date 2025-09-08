using BankProject.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.Entities
{
    public class Account
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AccountId { get; set; }

        [Required]
        public string CurrencyType { get; set; } = string.Empty;

        [Required]
        public string AccountType { get; set; } = string.Empty;

        [Required, Precision(18, 2)]
        public decimal Balance { get; set; } = 0;

        [Required, StringLength(26)]
        public string IBAN { get; set; } = string.Empty;

        [Required]
        public DateTime DateCreated { get; set; } = DateTime.UtcNow;

        [ForeignKey("User")]
        public int UserId { get; set; }
        [Required]
        public bool IsActive { get; set; } = true;
    }
}



