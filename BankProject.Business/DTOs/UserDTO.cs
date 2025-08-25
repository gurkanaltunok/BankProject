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
        [RegularExpression(@"^\d{11}$", ErrorMessage = "TCKN must be exactly 11 digits.")]
        public string TCKN { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Surname { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6), MaxLength(50)]
        public string Password { get; set; } = string.Empty;

        [Required, RegularExpression(@"^\d{10}$", ErrorMessage = "Phone number must be exactly 10 digits.")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string Address { get; set; } = string.Empty;
    }
}
