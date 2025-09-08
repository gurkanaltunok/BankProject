using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using BankProject.Business.Helpers;
using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BankProject.Business.Concrete
{
    public class AuthManager : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _config;

        public AuthManager(IUserRepository userRepository, IConfiguration config)
        {
            _userRepository = userRepository;
            _config = config;
        }

        public AuthResultDTO Register(UserRegisterDTO dto)
        {
            if (_userRepository.GetByTCKN(dto.TCKN) != null)
                return new AuthResultDTO { Success = false, Message = "TCKN zaten mevcut." };

            PasswordHelper.CreatePasswordHash(dto.Password, out byte[] hash, out byte[] salt);

            var user = new User
            {
                TCKN = dto.TCKN,
                Name = dto.Name,
                Surname = dto.Surname,
                Email = dto.Email,
                Address = dto.Address,
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = hash,
                PasswordSalt = salt,
                RoleId = 1
            };

            _userRepository.CreateUser(user);

            return new AuthResultDTO { Success = true };
        }

        public AuthResultDTO Login(LoginDTO dto)
        {
            var user = _userRepository.GetByTCKN(dto.TCKN);
            if (user == null || !PasswordHelper.VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
                return new AuthResultDTO { Success = false, Message = "Geçersiz TCKN veya şifre." };

            var token = GenerateJwtToken(user);

            return new AuthResultDTO
            {
                Success = true,
                Token = token,
                UserId = user.Id,
                RoleId = user.RoleId
            };
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
                new Claim("RoleId", user.RoleId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.RoleId.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(24), // Extended token lifetime for better UX
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
