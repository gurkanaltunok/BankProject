using BankProject.Business.Abstract;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankProject.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BalanceHistoryController : ControllerBase
    {
        private readonly IBalanceHistoryService _balanceHistoryService;

        public BalanceHistoryController(IBalanceHistoryService balanceHistoryService)
        {
            _balanceHistoryService = balanceHistoryService;
        }

        [HttpGet("account/{accountId}")]
        public IActionResult GetBalanceHistoryByAccount(int accountId)
        {
            var balanceHistory = _balanceHistoryService.GetBalanceHistoryByAccount(accountId);
            return Ok(balanceHistory);
        }

        [HttpGet("account/{accountId}/daterange")]
        public IActionResult GetBalanceHistoryByDateRange(int accountId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var balanceHistory = _balanceHistoryService.GetBalanceHistoryByAccountAndDateRange(accountId, startDate, endDate);
            return Ok(balanceHistory);
        }
    }
}
