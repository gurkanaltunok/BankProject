using System.ComponentModel.DataAnnotations;

namespace BankProject.Business.DTOs
{
    public class AddressDTO
    {
        public int AddressId { get; set; }
        
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

        public int UserId { get; set; }
    }

    public class CreateAddressDTO
    {
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

        public int UserId { get; set; }
    }
}
