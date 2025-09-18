using BankProject.DataAccess.Abstract;
using BankProject.Entities;

namespace BankProject.DataAccess.Concrete
{
    public class ExchangeRateRepository : IExchangeRateRepository
    {
        private readonly BankDbContext _context;

        public ExchangeRateRepository(BankDbContext context)
        {
            _context = context;
        }

        public ExchangeRate AddExchangeRate(ExchangeRate exchangeRate)
        {
            _context.ExchangeRates.Add(exchangeRate);
            _context.SaveChanges();
            return exchangeRate;
        }

        public ExchangeRate? GetLatestExchangeRate(string fromCurrency, string toCurrency)
        {
            return _context.ExchangeRates
                .Where(e => e.FromCurrency == fromCurrency && e.ToCurrency == toCurrency)
                .OrderByDescending(e => e.Date)
                .FirstOrDefault();
        }

        public List<ExchangeRate> GetExchangeRatesByDateRange(DateTime startDate, DateTime endDate)
        {
            return _context.ExchangeRates
                .Where(e => e.Date >= startDate && e.Date <= endDate)
                .OrderByDescending(e => e.Date)
                .ToList();
        }

        public List<ExchangeRate> GetAllExchangeRates()
        {
            return _context.ExchangeRates
                .OrderByDescending(e => e.Date)
                .ToList();
        }
    }
}
