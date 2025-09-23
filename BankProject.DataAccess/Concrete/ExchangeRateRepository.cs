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

        public ExchangeRate? GetLatestExchangeRate()
        {
            return _context.ExchangeRates
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

        public List<ExchangeRate> GetExchangeRatesByDate(DateTime date)
        {
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays(1);
            
            return _context.ExchangeRates
                .Where(e => e.Date >= startOfDay && e.Date < endOfDay)
                .OrderByDescending(e => e.Date)
                .ToList();
        }

        public List<ExchangeRate> GetPreviousDayExchangeRates()
        {
            // Türkiye saati (GMT+3) kullan
            var turkeyTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time"));
            var yesterday = turkeyTime.Date.AddDays(-1);
            var today = turkeyTime.Date;
            
            // Önce düne ait veriyi ara
            var yesterdayRates = GetExchangeRatesByDate(yesterday);
            if (yesterdayRates.Any())
            {
                return yesterdayRates;
            }
            
            // Düne ait veri yoksa, bugünden önceki en son veriyi al
            return _context.ExchangeRates
                .Where(e => e.Date < today)
                .OrderByDescending(e => e.Date)
                .Take(1)
                .ToList();
        }

    }
}
