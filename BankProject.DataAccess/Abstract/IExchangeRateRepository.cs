using BankProject.Entities;

namespace BankProject.DataAccess.Abstract
{
    public interface IExchangeRateRepository
    {
        ExchangeRate AddExchangeRate(ExchangeRate exchangeRate);
        ExchangeRate? GetLatestExchangeRate(string currency);
        List<ExchangeRate> GetExchangeRatesByDateRange(DateTime startDate, DateTime endDate);
        List<ExchangeRate> GetAllExchangeRates();
        List<ExchangeRate> GetExchangeRatesByDate(DateTime date);
        List<ExchangeRate> GetPreviousDayExchangeRates();
        List<ExchangeRate> GetExchangeRatesByCurrency(string currency);
    }
}
