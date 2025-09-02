using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BankProject.Business.DTOs;
using BankProject.Business.Helpers;
using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BankProject.Business.Concrete
{
    public class AuthManager
    {
        private readonly IUserRepository _userRepo;
        private readonly IConfiguration _config;

        public AuthManager(IUserRepository userRepo, IConfiguration config)
        {
            _userRepo = userRepo;
            _config = config;
        }

        public User Register(User user, string password)
        {
            if (_userRepo.GetByTCKN(user.TCKN) != null)
                throw new Exception("TCKN zaten mevcut.");

            PasswordHelper.CreatePasswordHash(password, out byte[] passwordHash, out byte[] passwordSalt);
            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;

            return _userRepo.CreateUser(user);
        }

        public object Login(LoginDTO dto)
        {
            var user = _userRepo.GetByTCKN(dto.TCKN);
            if (user == null)
                return null;

            if (!PasswordHelper.VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
                return null;

            var token = GenerateJwtToken(user);

            return new
            {
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
                new Claim("role", user.RoleId.ToString()),
                new Claim("UserId", user.Id.ToString())
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
