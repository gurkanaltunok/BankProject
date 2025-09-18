using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.Business.DTOs
{
    public class UserRegisterDTO
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

        [Required, RegularExpression(@"^\d{6}$", ErrorMessage = "Şifre 6 haneli olmalı ve sadece rakamlardan oluşmalı.")]
        public string Password { get; set; } = string.Empty;

        [RegularExpression(@"^5[0-9]{9}$", ErrorMessage = "Telefon numarası 10 haneli olmalı ve 5 ile başlamalı.")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public DateTime BirthDate { get; set; }

        // Adres bilgileri
        [Required]
        [MaxLength(100)]
        public string Country { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string District { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Neighborhood { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string AddressDetail { get; set; } = string.Empty;
    }

}
