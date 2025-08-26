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

    [HttpGet]
    public IActionResult GetAllUsers()
    {
        var users = _userService.GetAllUsers();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public IActionResult GetUserById(int id)
    {
        var user = _userService.GetUserById(id);
        if (user == null)
            return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public IActionResult Post([FromBody] UserDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new User
        {
            TCKN = dto.TCKN,
            Name = dto.Name,
            Surname = dto.Surname,
            Email = dto.Email,
            Password = dto.Password,
            PhoneNumber = dto.PhoneNumber,
            Address = dto.Address,
            RoleId = 1 // default 1 for customer
        };

        var createdUser = _userService.CreateUser(user);
        return Ok(createdUser);
    }

    [HttpPut("{id}")]
    public IActionResult Put(int id, [FromBody] UserDTO dto)
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
        existingUser.Password = dto.Password;
        existingUser.PhoneNumber = dto.PhoneNumber;
        existingUser.Address = dto.Address;
        var updatedUser = _userService.UpdateUser(existingUser);
        return Ok(updatedUser);
    }
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var existingUser = _userService.GetUserById(id);
        if (existingUser == null)
            return NotFound();
        _userService.DeleteUser(id);
        return NoContent();
    }
}
