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

public class UserManager : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _config;

    public UserManager(IUserRepository userRepository, IConfiguration config)
    {
        _userRepository = userRepository;
        _config = config;
    }

    public User CreateUser(User user, string password)
    {
        var existingUser = _userRepository.GetByTCKN(user.TCKN);
        if (existingUser != null)
            throw new Exception("Bu TCKN zaten kayıtlı.");

        PasswordHelper.CreatePasswordHash(password, out byte[] hash, out byte[] salt);
        user.PasswordHash = hash;
        user.PasswordSalt = salt;

        return _userRepository.CreateUser(user);
    }


    public void DeleteUser(int id)
    {
        _userRepository.DeleteUser(id);
    }

    public List<User> GetAllUsers()
    {
        return _userRepository.GetAllUsers();
    }

    public User GetUserById(int id)
    {
        if (id <= 0)
            throw new ArgumentException("Geçersiz kullanıcı ID.");

        return _userRepository.GetUserById(id);
    }

    public User UpdateUser(User user)
    {
        return _userRepository.UpdateUser(user);
    }

    // LOGIN -> JWT token döner
    public string Login(LoginDTO dto)
    {
        var user = _userRepository.GetByTCKN(dto.TCKN);
        if (user == null)
            throw new Exception("Kullanıcı bulunamadı.");

        if (!PasswordHelper.VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
            throw new Exception("Geçersiz şifre.");

        // JWT oluştur
        var keyString = _config["Jwt:Key"];
        if (string.IsNullOrEmpty(keyString))
            throw new InvalidOperationException("JWT key is not configured.");

        var key = Encoding.UTF8.GetBytes(keyString);
        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.TCKN),
                new Claim(ClaimTypes.Role, user.RoleId.ToString())
            }),
            Expires = DateTime.UtcNow.AddMinutes(15),
            Issuer = _config["Jwt:Issuer"],
            Audience = _config["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }


    public void ChangePassword(int userId, string newPassword)
    {
        PasswordHelper.CreatePasswordHash(newPassword, out byte[] hash, out byte[] salt);
        _userRepository.ChangePassword(userId, hash, salt);
    }
}
