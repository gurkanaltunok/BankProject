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
        [RegularExpression(@"^\d{11}$", ErrorMessage = "TCKN 11 haneli olmalı.")]
        public string TCKN { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "Şifre en az 6 karakter olmalı.")]
        public string Password { get; set; } = string.Empty;
    }
}

