using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BankProject.Entities.Enums;

namespace BankProject.Business.DTOs
{
    public class AccountDTO
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public CurrencyType CurrencyType { get; set; }

        [Required]
        public AccountType AccountType { get; set; }
        [Required]
        public bool IsActive { get; set; } = true;
    }
}
