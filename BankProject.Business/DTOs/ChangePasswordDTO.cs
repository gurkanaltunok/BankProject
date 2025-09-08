using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.Business.DTOs
{
    public class ChangePasswordDTO
    {
        public int UserId { get; set; }
        public string NewPassword { get; set; } = string.Empty;
    }
}

