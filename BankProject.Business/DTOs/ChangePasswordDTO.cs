using System.ComponentModel.DataAnnotations;

namespace BankProject.Business.DTOs
{
    public class ChangePasswordDTO
    {
        [Required(ErrorMessage = "Mevcut şifre gereklidir")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Yeni şifre gereklidir")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Şifre 6 haneli olmalı ve sadece rakamlardan oluşmalı")]
        public string NewPassword { get; set; } = string.Empty;
    }
}