using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace BankProject.Business.DTOs
{
    public class LoginDTO
    {
        [Required]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "TCKN must be exactly 11 digits.")]
        public string TCKN { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string Password { get; set; } = string.Empty;
    }
}

