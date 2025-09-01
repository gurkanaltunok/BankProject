using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionsController : ControllerBase
    {
        private readonly ITransactionService _transactionService;

        public TransactionsController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        [HttpPost("deposit")]
        public IActionResult Deposit([FromBody] DepositWithdrawDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
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
            var transactions = _transactionService.GetTransactionsByAccountId(accountId);
            return Ok(transactions);
        }
    }
}
