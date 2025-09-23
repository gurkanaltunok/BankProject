using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using BankProject.Business.Helpers;
using BankProject.Entities;
using BankProject.Entities.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Razor.TagHelpers;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly IUserService _userService;
        private readonly IExchangeRateService _exchangeRateService;
        private readonly HttpClient _httpClient;

        public AccountsController(IAccountService accountService, IUserService userService, IExchangeRateService exchangeRateService, HttpClient httpClient)
        {
            _accountService = accountService;
            _userService = userService;
            _exchangeRateService = exchangeRateService;
            _httpClient = httpClient;
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

        [HttpGet("my-accounts")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public IActionResult GetMyAccounts()
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null)
                return Unauthorized();

            var userId = int.Parse(userIdClaim.Value);
            var accounts = _accountService.GetAccountsByUserId(userId);
            foreach (var account in accounts)
            {
            }
            return Ok(accounts);
        }

        [HttpGet("my-total-balance")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> GetMyTotalBalance()
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null)
                return Unauthorized();

            var userId = int.Parse(userIdClaim.Value);
            var accounts = _accountService.GetAccountsByUserId(userId);
            
            var totalBalanceInTRY = await CalculateTotalBalanceInTRY(accounts);
            
            return Ok(new { totalBalanceInTRY });
        }

        private async Task<decimal> CalculateTotalBalanceInTRY(List<Account> accounts)
        {
            decimal totalBalance = 0;

            foreach (var account in accounts)
            {
                if (account.CurrencyType == CurrencyType.TRY)
                {
                    totalBalance += account.Balance;
                }
                else
                {
                    var convertedAmount = _exchangeRateService.ConvertCurrency(account.Balance, GetCurrencyString(account.CurrencyType), "TRY");
                    totalBalance += convertedAmount;
                }
            }

            return totalBalance;
        }

        private string GetCurrencyString(CurrencyType currencyType)
        {
            return currencyType switch
            {
                CurrencyType.TRY => "TRY",
                CurrencyType.USD => "USD",
                CurrencyType.EUR => "EUR",
                CurrencyType.GBP => "GBP",
                _ => "TRY"
            };
        }

        [HttpGet("by-iban/{iban}")]
        public IActionResult GetAccountByIban(string iban)
        {
            var account = _accountService.GetAccountByIban(iban);
            if (account == null)
                return NotFound(new { Message = "Bu IBAN numarasına sahip hesap bulunamadı." });

            return Ok(account);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteAccountById(int id)
        {
            var existingAccount = _accountService.GetAccountById(id);
            if (existingAccount == null)
                return NotFound(new { Message = "Hesap bulunamadı." });

            var result = _accountService.DeleteAccount(id);
            if (!result)
                return BadRequest(new { Message = "Hesap kapatma işlemi başarısız." });

            return Ok(new { Message = "Hesap başarıyla kapatıldı." });
        }



        [HttpPost]
        public IActionResult CreateAccount([FromBody] AccountDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = _userService.GetUserById(dto.UserId);
            if (user == null)
                return BadRequest("Kullanıcı bulunamadı.");

            string iban = IbanHelper.GenerateIban(dto.UserId);

            var account = new Account
            {
                UserId = dto.UserId,
                CurrencyType = (CurrencyType)int.Parse(dto.CurrencyType),
                AccountType = (AccountType)int.Parse(dto.AccountType),
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
            existingAccount.CurrencyType = (CurrencyType)int.Parse(dto.CurrencyType);
            existingAccount.AccountType = (AccountType)int.Parse(dto.AccountType);
            existingAccount.IsActive = dto.IsActive;
            var updatedAccount = _accountService.UpdateAccount(existingAccount);
            return Ok(updatedAccount);
        }


        private async Task<decimal> GetCurrentExchangeRateAsync(string fromCurrency, string toCurrency)
        {
            try
            {
                var response = await _httpClient.GetStringAsync("https://api.exchangerate-api.com/v4/latest/TRY");
                var jsonDoc = JsonDocument.Parse(response);
                
                if (jsonDoc.RootElement.TryGetProperty("rates", out var ratesElement))
                {
                    if (fromCurrency == "TRY")
                    {
                        var toRate = ratesElement.GetProperty(toCurrency).GetDecimal();
                        return 1.0m / toRate;
                    }
                    else if (toCurrency == "TRY")
                    {
                        var fromRate = ratesElement.GetProperty(fromCurrency).GetDecimal();
                        return 1.0m / fromRate;
                    }
                }
            }
            catch (Exception ex)
            {
            }

            var fallbackRates = new Dictionary<string, decimal>
            {
                { "TRY", 1.0m },
                { "USD", 41.32m },
                { "EUR", 44.85m },
                { "GBP", 52.48m }
            };

            if (fallbackRates.ContainsKey(fromCurrency) && fallbackRates.ContainsKey(toCurrency))
            {
                return fallbackRates[toCurrency] / fallbackRates[fromCurrency];
            }

            return 1.0m;
        }
    }
}


