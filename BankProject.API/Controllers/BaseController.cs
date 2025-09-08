using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace BankProject.API.Controllers
{
    [ApiController]
    public class BaseController : ControllerBase
    {
        protected int UserId => int.Parse(User.Claims.First(c => c.Type == "UserId").Value);
        protected int RoleId => int.Parse(User.Claims.First(c => c.Type == "RoleId").Value);

        protected bool IsAdmin => RoleId == 2;
    }
}
