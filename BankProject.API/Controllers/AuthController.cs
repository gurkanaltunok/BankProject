using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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

        [HttpPost("change-password")]
        [Authorize]
        public IActionResult ChangePassword([FromBody] ChangePasswordDTO dto)
        {
            try
            {
                // Get current user ID from token
                var userIdClaim = User.FindFirst("UserId");
                if (userIdClaim == null)
                    return Unauthorized();

                var userId = int.Parse(userIdClaim.Value);
                var result = _authService.ChangePassword(userId, dto.CurrentPassword, dto.NewPassword);

                if (!result.Success)
                    return BadRequest(result.Message);

                return Ok(new { Message = "Şifre başarıyla değiştirildi." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}
