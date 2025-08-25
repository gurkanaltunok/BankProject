using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.Entities
{
    public class Role
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RoleId { get; set; }

        [Required, MaxLength(50)]
        public string RoleName { get; set; } = string.Empty;

        public virtual ICollection<User> Users { get; set; } = new List<User>();
    }
}
