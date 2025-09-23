using BankProject.Business.Abstract;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        private readonly IExchangeRateService _exchangeRateService;
        private readonly HttpClient _httpClient;

        public TestController(IExchangeRateService exchangeRateService, HttpClient httpClient)
        {
            _exchangeRateService = exchangeRateService;
            _httpClient = httpClient;
        }

        [HttpGet("exchangerate-api")]
        public async Task<IActionResult> TestExchangeRateApi()
        {
            try
            {
                // ExchangeRate-API'yi doğrudan test et
                var apiKey = "0c7506c907abcdd533b701f2";
                var url = $"https://v6.exchangerate-api.com/v6/{apiKey}/latest/USD";
                
                var response = await _httpClient.GetStringAsync(url);
                var jsonDoc = JsonDocument.Parse(response);
                
                return Ok(new
                {
                    message = "ExchangeRate-API test",
                    statusCode = "200",
                    response = jsonDoc.RootElement
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message, StackTrace = ex.StackTrace });
            }
        }

        [HttpGet("exchange-service")]
        public async Task<IActionResult> TestExchangeService()
        {
            try
            {
                var allRates = await _exchangeRateService.GetAllRatesAsync();
                
                return Ok(new
                {
                    message = "ExchangeRateService test",
                    rates = allRates,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message, StackTrace = ex.StackTrace });
            }
        }

        [HttpGet("test-currency-conversion")]
        public async Task<IActionResult> TestCurrencyConversion()
        {
            try
            {
                var testAmount = 1000m;
                var conversions = new List<object>();
                
                var currencies = new[] { "USD", "EUR", "GBP" };
                foreach (var currency in currencies)
                {
                    var convertedAmount = _exchangeRateService.ConvertCurrency(testAmount, currency, "TRY");
                    conversions.Add(new
                    {
                        from = currency,
                        to = "TRY",
                        amount = testAmount,
                        convertedAmount = convertedAmount,
                        rate = convertedAmount / testAmount
                    });
                }

                return Ok(new
                {
                    message = "Currency conversion test",
                    conversions = conversions,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message, StackTrace = ex.StackTrace });
            }
        }

        [HttpGet("exchange-rates-with-change")]
        public async Task<IActionResult> GetExchangeRatesWithChange()
        {
            try
            {
                var ratesWithChange = await _exchangeRateService.GetDailyRatesWithChangeAsync();
                
                return Ok(new
                {
                    message = "Exchange rates with daily change",
                    rates = ratesWithChange,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message, StackTrace = ex.StackTrace });
            }
        }
    }
}
