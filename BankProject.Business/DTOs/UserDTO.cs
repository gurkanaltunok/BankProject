using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.Business.DTOs
{
    public class UserDTO
    {
        [Required]
        [RegularExpression(@"^[1-9][0-9]{10}$", ErrorMessage = "TCKN 11 haneli olmalı ve 0 ile başlayamaz.")]
        public string TCKN { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Surname { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6), MaxLength(50)]
        public string Password { get; set; } = string.Empty;

        [RegularExpression(@"^5[0-9]{9}$", ErrorMessage = "Telefon numarası 10 haneli olmalı ve 5 ile başlamalı.")]
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
