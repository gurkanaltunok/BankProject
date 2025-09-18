using System.ComponentModel.DataAnnotations;

namespace BankProject.Business.DTOs
{
    public class UpdateRoleDTO
    {
        [Required]
        public int RoleId { get; set; }
    }
}
