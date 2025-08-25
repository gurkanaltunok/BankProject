using BankProject.Business.DTOs;
using BankProject.DataAccess;
using BankProject.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using BankProject.Entities.Enums;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly BankDbContext dbContext;

        public AccountsController(BankDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        [HttpGet("{id}")]
        public IActionResult GetAccountById(int id)
        {
            var account = dbContext.Accounts.Find(id);
            if (account == null)
                return NotFound();

            return Ok(account);
        }

        [HttpGet]
        public IActionResult GetAllAccounts()
        {
            var accounts = dbContext.Accounts.ToList();
            return Ok(accounts);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteAccountById(int id)
        {
            var account = dbContext.Accounts.Find(id);
            if (account == null)
                return NotFound();

            dbContext.Accounts.Remove(account);
            dbContext.SaveChanges();
            return NoContent();
        }

        [HttpPost]
        public IActionResult CreateAccount([FromBody] AccountDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = dbContext.Users.Find(dto.UserId);
            if (user == null)
                return BadRequest("User not found.");


            string iban = GenerateIban(dto.CurrencyType.ToString());

            var account = new Account
            {
                UserId = dto.UserId,
                CurrencyType = dto.CurrencyType,
                AccountType = dto.AccountType,
                Balance = 0,
                IBAN = iban
            };

            dbContext.Accounts.Add(account);
            dbContext.SaveChanges();

            return Ok(account);
        }
        private string GenerateIban(string currency)
        {
            return $"TR{DateTime.Now.Ticks.ToString().Substring(0, 16)}{currency.ToUpper()}";
        }
    }
}
