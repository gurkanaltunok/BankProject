using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BankProject.Business.DTOs;
using BankProject.Business.Helpers;
using BankProject.DataAccess;
using BankProject.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly BankDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(BankDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] UserRegisterDTO dto)
        {
            if (_context.Users.Any(u => u.TCKN == dto.TCKN))
                return BadRequest("TCKN zaten mevcut.");

            PasswordHelper.CreatePasswordHash(dto.Password, out byte[] passwordHash, out byte[] passwordSalt);

            var user = new User
            {
                TCKN = dto.TCKN,
                Name = dto.Name,
                Surname = dto.Surname,
                Email = dto.Email,
                Address = dto.Address,
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                RoleId = 1 // Normal kullanıcı
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok("Kullanıcı başarıyla kayıt oldu.");
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDTO dto)
        {
            if (string.IsNullOrEmpty(dto.TCKN) || string.IsNullOrEmpty(dto.Password))
                return BadRequest("TCKN ve şifre gereklidir.");

            var user = _context.Users.FirstOrDefault(u => u.TCKN == dto.TCKN);
            if (user == null || !PasswordHelper.VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
                return Unauthorized("Geçersiz TCKN veya şifre.");

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                Token = token,
                UserId = user.Id,
                RoleId = user.RoleId
            });
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _config["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey))
                throw new InvalidOperationException("JWT key is not configured.");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.TCKN),
                new Claim("UserId", user.Id.ToString()),
                new Claim("RoleId", user.RoleId.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
