using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] UserRegisterDTO dto)
        {
            var result = _authService.Register(dto);

            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(new { Message = "Kullanıcı başarıyla kayıt oldu." });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDTO dto)
        {
            var result = _authService.Login(dto);

            if (!result.Success)
                return Unauthorized(result.Message);

            return Ok(new
            {
                Token = result.Token,
                UserId = result.UserId,
                RoleId = result.RoleId
            });
        }
    }
}
