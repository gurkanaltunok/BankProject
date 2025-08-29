using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using BankProject.Entities;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    // ✅ Tüm kullanıcıları getir
    [HttpGet]
    public IActionResult GetAllUsers()
    {
        var users = _userService.GetAllUsers();
        return Ok(users);
    }

    // ✅ ID ile kullanıcı getir
    [HttpGet("{id}")]
    public IActionResult GetUserById(int id)
    {
        var user = _userService.GetUserById(id);
        if (user == null)
            return NotFound();

        return Ok(user);
    }

    // ✅ Kayıt (Register)
    [HttpPost("register")]
    public IActionResult Register([FromBody] UserRegisterDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new User
        {
            TCKN = dto.TCKN,
            Name = dto.Name,
            Surname = dto.Surname,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            Address = dto.Address,
            RoleId = 1 // default müşteri
        };

        var createdUser = _userService.CreateUser(user, dto.Password);
        return Ok(createdUser);
    }

    // ✅ Güncelleme
    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] UserUpdateDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var existingUser = _userService.GetUserById(id);
        if (existingUser == null)
            return NotFound();

        existingUser.TCKN = dto.TCKN;
        existingUser.Name = dto.Name;
        existingUser.Surname = dto.Surname;
        existingUser.Email = dto.Email;
        existingUser.PhoneNumber = dto.PhoneNumber;
        existingUser.Address = dto.Address;

        var updatedUser = _userService.UpdateUser(existingUser);
        return Ok(updatedUser);
    }

    // ✅ Silme
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var existingUser = _userService.GetUserById(id);
        if (existingUser == null)
            return NotFound();

        _userService.DeleteUser(id);
        return NoContent();
    }

    // ✅ Login
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDTO dto)
    {
        try
        {
            var token = _userService.Login(dto);
            return Ok(new { Message = "Login successful", Token = token });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    // ✅ Şifre Değiştirme
    [HttpPost("change-password")]
    public IActionResult ChangePassword([FromBody] ChangePasswordDTO dto)
    {
        try
        {
            _userService.ChangePassword(dto.UserId, dto.NewPassword);
            return Ok(new { Message = "Password updated successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
