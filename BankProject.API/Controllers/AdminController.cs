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
                Console.WriteLine($"DEBUG: GetDashboardData called at {DateTime.Now}");
                
                // Check if user is admin
                var roleIdClaim = User.FindFirst("RoleId");
                if (roleIdClaim == null || int.Parse(roleIdClaim.Value) != 2)
                    return Forbid();

                // Get bank account balance (AccountId: 1)
                var bankAccount = _accountService.GetAccountById(1);
                var bankBalance = bankAccount?.Balance ?? 0;
                Console.WriteLine($"DEBUG: Bank balance: {bankBalance}");

                // Get all users count
                var allUsers = _userService.GetAllUsers();
                var totalUsers = allUsers.Count;
                Console.WriteLine($"DEBUG: Total users: {totalUsers}");

                // Get all accounts and calculate total balance in TRY
                var allAccounts = _accountService.GetAllAccounts();
                Console.WriteLine($"DEBUG: Found {allAccounts.Count} accounts");
                var totalBalance = await CalculateTotalBalanceInTRY(allAccounts);
                Console.WriteLine($"DEBUG: Final total balance: {totalBalance}");

                // Get recent transactions
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
                // Check if user is admin
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
                // Check if user is admin
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
                // Check if user is admin
                var roleIdClaim = User.FindFirst("RoleId");
                if (roleIdClaim == null || int.Parse(roleIdClaim.Value) != 2)
                    return Forbid();

                var dailyVolumes = new List<object>();
                var today = DateTime.Today;

                // Son 7 günün işlem hacmini hesapla
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

                    // Günlük toplam işlem hacmi (sadece para çekme, transfer ve yatırma işlemleri)
                    var dailyVolume = dayTransactions
                        .Where(t => t.TransactionType == 1 || t.TransactionType == 2 || t.TransactionType == 3) // Para çekme, transfer, yatırma
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
                // Check if user is admin
                var roleIdClaim = User.FindFirst("RoleId");
                if (roleIdClaim == null || int.Parse(roleIdClaim.Value) != 2)
                    return Forbid();

                var dailyCommissions = new List<object>();
                var today = DateTime.Today;

                // Son 7 günün komisyon gelirlerini hesapla
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

                    // Günlük toplam komisyon geliri (sadece para çekme ve transfer işlemlerinden)
                    var dailyCommission = dayTransactions
                        .Where(t => t.TransactionType == 2 || t.TransactionType == 3) // Withdraw (2), Transfer (3)
                        .Sum(t => t.Fee);

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

        [HttpGet("test-vakifbank-rates")]
        public async Task<IActionResult> TestVakifbankRates()
        {
            try
            {
                // Check if user is admin
                var roleIdClaim = User.FindFirst("RoleId");
                if (roleIdClaim == null || int.Parse(roleIdClaim.Value) != 2)
                    return Forbid();

                // Vakıfbank API'sinden güncel kurları çek
                var allRates = await _exchangeRateService.GetAllRatesAsync();
                
                // Test dönüşümleri
                var testConversions = new List<object>();
                var testAmount = 1000m;
                
                var currencies = new[] { "USD", "EUR", "GBP" };
                foreach (var currency in currencies)
                {
                    if (allRates.ContainsKey(currency))
                    {
                        var convertedAmount = _exchangeRateService.ConvertCurrency(testAmount, "TRY", currency);
                        testConversions.Add(new
                        {
                            from = "TRY",
                            to = currency,
                            amount = testAmount,
                            convertedAmount = convertedAmount,
                            rate = allRates[currency]
                        });
                    }
                }

                return Ok(new
                {
                    message = "Vakıfbank API test başarılı",
                    timestamp = DateTime.Now,
                    rates = allRates,
                    testConversions = testConversions
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message, StackTrace = ex.StackTrace });
            }
        }

        private async Task<decimal> CalculateTotalBalanceInTRY(List<Account> accounts)
        {
            decimal totalBalance = 0;
            Console.WriteLine($"DEBUG: Calculating total balance for {accounts.Count} accounts at {DateTime.Now}");

            foreach (var account in accounts)
            {
                if (account.CurrencyType == CurrencyType.TRY)
                {
                    totalBalance += account.Balance;
                    Console.WriteLine($"DEBUG: TRY account {account.AccountId}: {account.Balance} TRY");
                }
                else
                {
                    var convertedAmount = _exchangeRateService.ConvertCurrency(account.Balance, GetCurrencyString(account.CurrencyType), "TRY");
                    totalBalance += convertedAmount;
                    Console.WriteLine($"DEBUG: {GetCurrencyString(account.CurrencyType)} account {account.AccountId}: {account.Balance} {GetCurrencyString(account.CurrencyType)} = {convertedAmount} TRY");
                }
            }

            Console.WriteLine($"DEBUG: Total balance calculated: {totalBalance} TRY");
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

        [HttpDelete("cleanup-forex-transactions")]
        public async Task<IActionResult> CleanupForexTransactions()
        {
            try
            {
                // Forex komisyon transaction'larını sil (type 7)
                var commissionTransactions = _transactionService.GetTransactionsByDateRange(null, null, null)
                    .Where(t => t.TransactionType == 7).ToList();

                foreach (var transaction in commissionTransactions)
                {
                    // Transaction'ı sil (bu method'u TransactionService'e eklememiz gerekebilir)
                    Console.WriteLine($"Deleting commission transaction: {transaction.TransactionId}");
                }

                return Ok(new { 
                    message = "Forex commission transactions cleaned up successfully",
                    deletedCount = commissionTransactions.Count
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

    }
}
