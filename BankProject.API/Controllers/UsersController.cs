using BankProject.Business.DTOs;
using BankProject.DataAccess;
using BankProject.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly BankDbContext dbContext;

        public UsersController(BankDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        [HttpGet]
        [Route("{id}")]
        public IActionResult GetUserById(int id)
        {
            var user = dbContext.Users.Find(id);
            if (user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }

        [HttpDelete]
        [Route("{id}")]
        public IActionResult DeleteUserById(int id)
        {
            var user = dbContext.Users.Find(id);
            if (user == null)
            {
                return NotFound();
            }
            dbContext.Users.Remove(user);
            dbContext.SaveChanges();
            return NoContent();
        }

        [HttpGet]
        public IActionResult GetAllUsers()
        {
            var allUsers = dbContext.Users.ToList();
            return Ok(allUsers);

        }

        [HttpPost]
        public IActionResult CreateUser([FromBody] UserDTO createUserDTO)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userEntity = new User()
            {
                TCKN = createUserDTO.TCKN,
                Name = createUserDTO.Name,
                Surname = createUserDTO.Surname,
                Email = createUserDTO.Email,
                Password = createUserDTO.Password,
                PhoneNumber = createUserDTO.PhoneNumber,
                Address = createUserDTO.Address,
                RoleId = 1 // default role for customer
            };

            dbContext.Users.Add(userEntity);
            dbContext.SaveChanges();

            return Ok(userEntity);
        }
    }
}
