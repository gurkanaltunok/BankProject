using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly ITransactionService _transactionService;

        public TransactionsController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        private int GetUserId() =>
            int.Parse(User.Claims.First(c => c.Type == "UserId").Value);

        private int GetRoleId() =>
            int.Parse(User.Claims.First(c => c.Type == "RoleId").Value);

        [HttpPost("deposit")]
        public IActionResult Deposit([FromBody] DepositWithdrawDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                int userId = GetUserId();
                int roleId = GetRoleId();

                // Eğer admin değilse, sadece kendi hesabına işlem yapabilir
                if (roleId != 2 && !_transactionService.CheckAccountOwner(dto.AccountId, userId))
                    return Forbid("Bu hesaba erişim yetkiniz yok.");

                _transactionService.Deposit(dto.AccountId, dto.Amount, dto.Description);
                return Ok(new { Message = "Para yatırma başarılı." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("withdraw")]
        public IActionResult Withdraw([FromBody] DepositWithdrawDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                int userId = GetUserId();
                int roleId = GetRoleId();

                if (roleId != 2 && !_transactionService.CheckAccountOwner(dto.AccountId, userId))
                    return Forbid("Bu hesaba erişim yetkiniz yok.");

                _transactionService.Withdraw(dto.AccountId, dto.Amount, dto.Description);
                return Ok(new { Message = "Para çekme başarılı." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("transfer")]
        public IActionResult Transfer([FromBody] TransferDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                int userId = GetUserId();
                int roleId = GetRoleId();

                // Gönderen hesabın sahibi kontrol ediliyor
                if (roleId != 2 && !_transactionService.CheckAccountOwner(dto.FromAccountId, userId))
                    return Forbid("Bu hesaba erişim yetkiniz yok.");

                _transactionService.Transfer(dto.FromAccountId, dto.ToAccountId, dto.Amount, dto.Description);
                return Ok(new { Message = "Transfer başarılı." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("account/{accountId}")]
        public IActionResult GetTransactionsByAccountId(int accountId)
        {
            int userId = GetUserId();
            int roleId = GetRoleId();

            if (roleId != 2 && !_transactionService.CheckAccountOwner(accountId, userId))
                return Forbid("Bu hesaba erişim yetkiniz yok.");

            var transactions = _transactionService.GetTransactionsByAccountId(accountId);
            return Ok(transactions);
        }

        [HttpGet("filter")]
        public IActionResult GetTransactionsByDateRange([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int? accountId = null)
        {
            int userId = GetUserId();
            int roleId = GetRoleId();

            if (accountId.HasValue)
            {
                if (roleId != 2 && !_transactionService.CheckAccountOwner(accountId.Value, userId))
                    return Forbid("Bu hesaba erişim yetkiniz yok.");
            }

            var transactions = _transactionService.GetTransactionsByDateRange(startDate, endDate, accountId);
            return Ok(transactions);
        }
    }
}
