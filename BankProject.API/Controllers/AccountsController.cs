using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using BankProject.Business.Helpers;
using BankProject.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly IUserService _userService;

        public AccountsController(IAccountService accountService, IUserService userService)
        {
            _accountService = accountService;
            _userService = userService;
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
        public IActionResult DeleteAccountById(int id)
        {
            var account = _accountService.GetAccountById(id);
            if (account == null)
                return NotFound();

            _accountService.DeleteAccount(id);
            return NoContent();
        }

        [HttpPost]
        public IActionResult CreateAccount([FromBody] AccountDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = _userService.GetUserById(dto.UserId);
            if (user == null)
                return BadRequest("User not found.");

            string iban = IbanHelper.GenerateIban(dto.UserId);

            var account = new Account
            {
                UserId = dto.UserId,
                CurrencyType = dto.CurrencyType,
                AccountType = dto.AccountType,
                Balance = 0,
                IBAN = iban,
                DateCreated = DateTime.UtcNow,
                IsActive = true
            };

            var created = _accountService.CreateAccount(account);
            return Ok(created);
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
