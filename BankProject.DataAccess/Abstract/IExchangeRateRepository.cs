using BankProject.Entities;

namespace BankProject.DataAccess.Abstract
{
    public interface IExchangeRateRepository
    {
        ExchangeRate AddExchangeRate(ExchangeRate exchangeRate);
        ExchangeRate? GetLatestExchangeRate(string fromCurrency, string toCurrency);
        List<ExchangeRate> GetExchangeRatesByDateRange(DateTime startDate, DateTime endDate);
        List<ExchangeRate> GetAllExchangeRates();
    }
}
