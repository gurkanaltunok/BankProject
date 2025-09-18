using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BankProject.Business.Abstract
{
    public interface IExchangeRateService
    {
        Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency);
        Task<Dictionary<string, decimal>> GetAllRatesAsync();
        decimal ConvertCurrency(decimal amount, string fromCurrency, string toCurrency);
    }
}
