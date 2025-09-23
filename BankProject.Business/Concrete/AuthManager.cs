using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using BankProject.Business.Helpers;
using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace BankProject.Business.Concrete
{
    public class AuthManager : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IAddressService _addressService;
        private readonly IConfiguration _config;

        public AuthManager(IUserRepository userRepository, IAddressService addressService, IConfiguration config)
        {
            _userRepository = userRepository;
            _addressService = addressService;
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
                PhoneNumber = dto.PhoneNumber,
                BirthDate = dto.BirthDate,
                PasswordHash = hash,
                PasswordSalt = salt,
                RoleId = 1
            };

            _userRepository.CreateUser(user);

            // Adres oluştur
            var addressDto = new CreateAddressDTO
            {
                Country = dto.Country,
                City = dto.City,
                District = dto.District,
                Neighborhood = dto.Neighborhood,
                AddressDetail = dto.AddressDetail,
                UserId = user.Id
            };

            var address = _addressService.CreateAddress(addressDto);

            // User'ın AddressId'sini güncelle
            user.AddressId = address.AddressId;
            _userRepository.UpdateUser(user);

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
                expires: DateTime.Now.AddMinutes(15), // 15 minute token lifetime for maximum security
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


        public AuthResultDTO ChangePassword(int userId, string currentPassword, string newPassword)
        {
            try
            {
                // Get user by ID
                var user = _userRepository.GetUserById(userId);
                if (user == null)
                    return new AuthResultDTO { Success = false, Message = "Kullanıcı bulunamadı." };

                // Verify current password
                if (!PasswordHelper.VerifyPasswordHash(currentPassword, user.PasswordHash, user.PasswordSalt))
                    return new AuthResultDTO { Success = false, Message = "Mevcut şifre yanlış." };

                // Validate new password format
                if (!System.Text.RegularExpressions.Regex.IsMatch(newPassword, @"^\d{6}$"))
                    return new AuthResultDTO { Success = false, Message = "Yeni şifre 6 haneli olmalı ve sadece rakamlardan oluşmalı." };

                // Hash new password
                PasswordHelper.CreatePasswordHash(newPassword, out byte[] newHash, out byte[] newSalt);

                // Update user password
                user.PasswordHash = newHash;
                user.PasswordSalt = newSalt;
                _userRepository.UpdateUser(user);

                return new AuthResultDTO { Success = true, Message = "Şifre başarıyla değiştirildi." };
            }
            catch (Exception ex)
            {
                return new AuthResultDTO { Success = false, Message = ex.Message };
            }
        }
    }
}
