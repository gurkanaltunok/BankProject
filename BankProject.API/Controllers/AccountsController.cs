using BankProject.Business.DTOs;
using BankProject.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using BankProject.Business.Abstract;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountsController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpGet("{id}")]
        public IActionResult GetAccountById(int id)
        {
            var account = _accountService.GetAccountById(id);
            if (account == null)
                return NotFound();
            return Ok(account);
        }

        [HttpGet]
        public IActionResult GetAllAccounts()
        {
            var accounts = _accountService.GetAllAccounts();
            return Ok(accounts);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteAccount(int id)
        {
            var existingAccount = _accountService.GetAccountById(id);
            if (existingAccount == null)
                return NotFound();
            _accountService.DeleteAccount(id);
            return NoContent();
        }

        [HttpPost]
        public IActionResult Post([FromBody] AccountDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var account = new Account
            {
                UserId = dto.UserId,
                IBAN = GenerateIban(),
                CurrencyType = dto.CurrencyType,
                Balance = 0,
                AccountType = dto.AccountType,
                DateCreated = DateTime.Now,
                IsActive = true
            };
            var createdAccount = _accountService.CreateAccount(account);
            return Ok(createdAccount);
        }
        private string GenerateIban()
        {
            return $"TR{DateTime.Now.Ticks.ToString().Substring(0, 2)}002240{DateTime.Now.Ticks.ToString().Substring(0, 16)}";
        }

        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] AccountDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var existingAccount = _accountService.GetAccountById(id);
            if (existingAccount == null)
                return NotFound();
            existingAccount.CurrencyType = dto.CurrencyType;
            existingAccount.AccountType = dto.AccountType;
            existingAccount.IsActive = dto.IsActive;
            var updatedAccount = _accountService.UpdateAccount(existingAccount);
            return Ok(updatedAccount);
        }
    }
}
