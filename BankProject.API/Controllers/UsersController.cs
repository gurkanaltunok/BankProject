using BankProject.Business.Abstract;
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
    public List<User> GetAllUsers()
    {
        return _userService.GetAllUsers();
    }

    [HttpGet("{id}")]
    public User Get(int id)
    {
        return _userService.GetUserById(id);
    }

    [HttpPost]
    public User Post([FromBody] User user)
    {
        return _userService.CreateUser(user);
    }
}
