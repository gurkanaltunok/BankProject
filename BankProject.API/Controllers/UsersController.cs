using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using BankProject.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public IActionResult GetCurrentUser()
    {
        // JWT token'dan user ID'yi al
        var userIdClaim = User.FindFirst("UserId");
        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var user = _userService.GetUserById(userId);
        if (user == null)
            return NotFound();

        return Ok(new
        {
            id = user.Id,
            name = user.Name,
            surname = user.Surname,
            email = user.Email,
            tckn = user.TCKN,
            phoneNumber = user.PhoneNumber,
            birthDate = user.BirthDate,
            address = user.Address,
            roleId = user.RoleId
        });
    }



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



    [HttpPut("{id}/role")]
    public IActionResult UpdateUserRole(int id, [FromBody] UpdateRoleDTO dto)
    {
        try
        {
            var user = _userService.GetUserById(id);
            if (user == null)
                return NotFound();

            user.RoleId = dto.RoleId;
            var updatedUser = _userService.UpdateUser(user);
            return Ok(updatedUser);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
