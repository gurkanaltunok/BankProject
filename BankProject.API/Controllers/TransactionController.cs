using System;
using BankProject.Business.Abstract;
using BankProject.Business.Concrete;
using BankProject.Business.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TransactionsController : BaseController
    {
        private readonly ITransactionService _transactionService;

        public TransactionsController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        private IActionResult AuthorizeAccount(int accountId)
        {
            if (!IsAdmin && !_transactionService.CheckAccountOwner(accountId, UserId))
                return Forbid("Bu hesaba erişim yetkiniz yok.");
            return null!;
        }

        [HttpPost("deposit")]
        public IActionResult Deposit([FromBody] DepositWithdrawDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var authResult = AuthorizeAccount(dto.AccountId);
            if (authResult != null) return authResult;

            try
            {
                var transaction = _transactionService.Deposit(dto.AccountId, dto.Amount, dto.Description);
                return Ok(transaction);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("withdraw")]
        public IActionResult Withdraw([FromBody] DepositWithdrawDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var authResult = AuthorizeAccount(dto.AccountId);
            if (authResult != null) return authResult;

            try
            {
                var transaction = _transactionService.Withdraw(dto.AccountId, dto.Amount, dto.Description);
                return Ok(transaction);
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

            var authResult = AuthorizeAccount(dto.FromAccountId);
            if (authResult != null)
                return authResult;

            try
            {
                var transactionDto = _transactionService.Transfer(
                    dto.FromAccountId,
                    dto.ToAccountId,
                    dto.Amount,
                    dto.Description
                );
                return Ok(transactionDto);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }



        [HttpGet("account/{accountId}")]
        public IActionResult GetTransactionsByAccountId(int accountId)
        {
            var authResult = AuthorizeAccount(accountId);
            if (authResult != null) return authResult;

            var transactions = _transactionService.GetTransactionsByAccountId(accountId);
            return Ok(transactions);
        }

        [HttpGet("filter")]
        public IActionResult GetTransactionsByDateRange([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int? accountId = null)
        {
            if (accountId.HasValue)
            {
                var authResult = AuthorizeAccount(accountId.Value);
                if (authResult != null) return authResult;
            }

            var transactions = _transactionService.GetTransactionsByDateRange(startDate, endDate, accountId);
            return Ok(transactions);
        }
    }
}
