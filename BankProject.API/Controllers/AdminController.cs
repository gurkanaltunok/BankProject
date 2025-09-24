using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using BankProject.Entities;
using BankProject.Entities.Enums;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IAccountService _accountService;
        private readonly ITransactionService _transactionService;
        private readonly IExchangeRateService _exchangeRateService;
        private readonly HttpClient _httpClient;

        public AdminController(
            IUserService userService, 
            IAccountService accountService,
            ITransactionService transactionService,
            IExchangeRateService exchangeRateService,
            HttpClient httpClient)
        {
            _userService = userService;
            _accountService = accountService;
            _transactionService = transactionService;
            _exchangeRateService = exchangeRateService;
            _httpClient = httpClient;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardData()
        {
            try
            {
                
                var roleIdClaim = User.FindFirst("RoleId");
                if (roleIdClaim == null || int.Parse(roleIdClaim.Value) != 2)
                    return Forbid();

                // Bank account balance (AccountId: 1)
                var bankAccount = _accountService.GetAccountById(1);
                var bankBalance = bankAccount?.Balance ?? 0;

                var allUsers = _userService.GetAllUsers();
                var totalUsers = allUsers.Count;

                var allAccounts = _accountService.GetAllAccounts();
                var totalBalance = await CalculateTotalBalanceInTRY(allAccounts);

                var recentTransactions = _transactionService.GetTransactionsByDateRange(
                    DateTime.Now.AddDays(-30), 
                    DateTime.Now,
                    null // accountId - null means all accounts
                );

                return Ok(new
                {
                    bankBalance,
                    totalUsers,
                    totalBalance,
                    totalAccounts = allAccounts.Count,
                    recentTransactionsCount = recentTransactions.Count,
                    users = allUsers.Select(u => new
                    {
                        id = u.Id,
                        name = u.Name,
                        surname = u.Surname,
                        email = u.Email,
                        tckn = u.TCKN,
                        phoneNumber = u.PhoneNumber,
                        birthDate = u.BirthDate,
                        address = u.Address != null ? new
                        {
                            country = u.Address.Country,
                            city = u.Address.City,
                            district = u.Address.District,
                            neighborhood = u.Address.Neighborhood,
                            addressDetail = u.Address.AddressDetail
                        } : null,
                        roleId = u.RoleId,
                        roleName = u.RoleId == 1 ? "Customer" : "Admin"
                    }),
                    accounts = allAccounts.Select(a => new
                    {
                        accountId = a.AccountId,
                        iban = a.IBAN,
                        balance = a.Balance,
                        currencyType = a.CurrencyType,
                        accountType = a.AccountType,
                        isActive = a.IsActive,
                        dateCreated = a.DateCreated,
                        userId = a.UserId,
                        userName = allUsers.FirstOrDefault(u => u.Id == a.UserId)?.Name + " " + 
                                  allUsers.FirstOrDefault(u => u.Id == a.UserId)?.Surname
                    })
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("bank-balance")]
        public IActionResult GetBankBalance()
        {
            try
            {
                var roleIdClaim = User.FindFirst("RoleId");
                if (roleIdClaim == null || int.Parse(roleIdClaim.Value) != 2)
                    return Forbid();

                var bankAccount = _accountService.GetAccountById(1);
                return Ok(new { balance = bankAccount?.Balance ?? 0 });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("total-balance")]
        public IActionResult GetTotalBalance()
        {
            try
            {
                var roleIdClaim = User.FindFirst("RoleId");
                if (roleIdClaim == null || int.Parse(roleIdClaim.Value) != 2)
                    return Forbid();

                var allAccounts = _accountService.GetAllAccounts();
                var totalBalance = allAccounts.Sum(a => a.Balance);

                return Ok(new { totalBalance });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("daily-transaction-volume")]
        public IActionResult GetDailyTransactionVolume()
        {
            try
            {
                var roleIdClaim = User.FindFirst("RoleId");
                if (roleIdClaim == null || int.Parse(roleIdClaim.Value) != 2)
                    return Forbid();

                var dailyVolumes = new List<object>();
                // UTC tarih sınırları kullan (işlemler UTC olarak kaydediliyor)
                var today = DateTime.UtcNow.Date;

                for (int i = 6; i >= 0; i--)
                {
                    var date = today.AddDays(-i);
                    var startOfDay = date;
                    var endOfDay = date.AddDays(1).AddTicks(-1);

                    var dayTransactions = _transactionService.GetTransactionsByDateRange(
                        startOfDay, 
                        endOfDay, 
                        null // Tüm hesaplar
                    );

                    // İşlem hacmine döviz işlemlerini de dahil et
                    var dailyVolume = dayTransactions
                        .Where(t => t.TransactionType == (int)TransactionType.Deposit 
                                 || t.TransactionType == (int)TransactionType.Withdraw 
                                 || t.TransactionType == (int)TransactionType.Transfer
                                 || t.TransactionType == (int)TransactionType.ExchangeBuy
                                 || t.TransactionType == (int)TransactionType.ExchangeSell
                                 || t.TransactionType == (int)TransactionType.ExchangeDeposit
                                 || t.TransactionType == (int)TransactionType.ExchangeWithdraw)
                        .Sum(t => Math.Abs(t.Amount));

                    dailyVolumes.Add(new
                    {
                        date = date.ToString("dd/MM"),
                        dayName = date.ToString("ddd"),
                        volume = dailyVolume
                    });
                }

                return Ok(dailyVolumes);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("daily-commission-revenue")]
        public IActionResult GetDailyCommissionRevenue()
        {
            try
            {
                var roleIdClaim = User.FindFirst("RoleId");
                if (roleIdClaim == null || int.Parse(roleIdClaim.Value) != 2)
                    return Forbid();

                var dailyCommissions = new List<object>();
                // UTC tarih sınırları kullan (işlemler UTC olarak kaydediliyor)
                var today = DateTime.UtcNow.Date;

                for (int i = 6; i >= 0; i--)
                {
                    var date = today.AddDays(-i);
                    var startOfDay = date;
                    var endOfDay = date.AddDays(1).AddTicks(-1);

                    var dayTransactions = _transactionService.GetTransactionsByDateRange(
                        startOfDay, 
                        endOfDay, 
                        null // Tüm hesaplar
                    );

                    // Komisyon geliri: banka hesabına (AccountId=1) yazılan Fee (type 4) işlem tutarlarının toplamı
                    var dailyCommission = dayTransactions
                        .Where(t => t.TransactionType == (int)TransactionType.Fee && t.AccountId == 1)
                        .Sum(t => t.Amount);

                    dailyCommissions.Add(new
                    {
                        date = date.ToString("dd/MM"),
                        dayName = date.ToString("ddd"),
                        commission = dailyCommission
                    });
                }

                return Ok(dailyCommissions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
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

        [HttpGet("exchange-service")]
        [AllowAnonymous]
        public async Task<IActionResult> GetExchangeService()
        {
            try
            {
                var rates = await _exchangeRateService.GetAllRatesAsync();
                return Ok(new { rates });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("exchange-rates-with-change")]
        [AllowAnonymous]
        public async Task<IActionResult> GetExchangeRatesWithChange()
        {
            try
            {
                var rates = await _exchangeRateService.GetDailyRatesWithChangeAsync();
                return Ok(new { rates });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }



    }
}
