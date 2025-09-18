using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using BankProject.Business.Abstract;
using System.Text.Json;

namespace BankProject.Business.Concrete
{
    public class ExchangeRateService : IExchangeRateService
    {
        private readonly HttpClient _httpClient;
        private Dictionary<string, decimal> _cachedRates;
        private DateTime _lastUpdate;
        private readonly TimeSpan _cacheExpiry = TimeSpan.FromMinutes(5);

        public ExchangeRateService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _cachedRates = new Dictionary<string, decimal>();
        }

        public async Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency)
        {
            if (fromCurrency == toCurrency)
                return 1.0m;

            await EnsureRatesAreFreshAsync();

            var key = $"{fromCurrency}_TO_{toCurrency}";
            if (_cachedRates.ContainsKey(key))
                return _cachedRates[key];

            // Try to get rate from cached rates
            if (_cachedRates.ContainsKey(fromCurrency) && _cachedRates.ContainsKey(toCurrency))
            {
                var fromRate = _cachedRates[fromCurrency];
                var toRate = _cachedRates[toCurrency];
                var rate = toRate / fromRate;
                _cachedRates[key] = rate;
                return rate;
            }

            // Fallback to mock rates if API fails
            return GetMockRate(fromCurrency, toCurrency);
        }

        public async Task<Dictionary<string, decimal>> GetAllRatesAsync()
        {
            await EnsureRatesAreFreshAsync();
            return new Dictionary<string, decimal>(_cachedRates);
        }

        public decimal ConvertCurrency(decimal amount, string fromCurrency, string toCurrency)
        {
            if (fromCurrency == toCurrency)
                return amount;

            try
            {
                // Gerçek zamanlı kurları çek
                var rates = GetAllRatesAsync().Result;
                
                if (rates.ContainsKey(fromCurrency) && rates.ContainsKey(toCurrency))
                {
                    var rate = rates[toCurrency] / rates[fromCurrency];
                    Console.WriteLine($"DEBUG: ConvertCurrency - {amount} {fromCurrency} to {toCurrency} = {amount * rate} (rate: {rate})");
                    return amount * rate;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exchange rate API error: {ex.Message}");
            }

            // Fallback rates
            var fallbackRates = new Dictionary<string, decimal>
            {
                { "TRY", 1.0m },
                { "USD", 41.32m },
                { "EUR", 44.85m },
                { "GBP", 52.48m }
            };

            if (fallbackRates.ContainsKey(fromCurrency) && fallbackRates.ContainsKey(toCurrency))
            {
                var rate = fallbackRates[toCurrency] / fallbackRates[fromCurrency];
                Console.WriteLine($"DEBUG: ConvertCurrency (fallback) - {amount} {fromCurrency} to {toCurrency} = {amount * rate} (rate: {rate})");
                return amount * rate;
            }

            return amount;
        }

        private async Task EnsureRatesAreFreshAsync()
        {
            if (_cachedRates.Count == 0 || DateTime.UtcNow - _lastUpdate > _cacheExpiry)
            {
                await FetchExchangeRatesAsync();
            }
        }

        private async Task FetchExchangeRatesAsync()
        {
            try
            {
                // Try to fetch from external API
                var response = await _httpClient.GetStringAsync("https://api.exchangerate-api.com/v4/latest/TRY");
                var jsonDoc = JsonDocument.Parse(response);
                
                if (jsonDoc.RootElement.TryGetProperty("rates", out var ratesElement))
                {
                    _cachedRates = new Dictionary<string, decimal>
                    {
                        { "TRY", 1.0m },
                        { "USD", 1.0m / ratesElement.GetProperty("USD").GetDecimal() },
                        { "EUR", 1.0m / ratesElement.GetProperty("EUR").GetDecimal() },
                        { "GBP", 1.0m / ratesElement.GetProperty("GBP").GetDecimal() }
                    };
                    _lastUpdate = DateTime.UtcNow;
                    return;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exchange rate API error: {ex.Message}");
            }

            // Fallback to mock rates
            SetMockRates();
        }

        private void SetMockRates()
        {
            _cachedRates = new Dictionary<string, decimal>
            {
                { "TRY", 1.0m },
                { "USD", 34.50m },
                { "EUR", 37.20m },
                { "GBP", 43.50m }
            };
            _lastUpdate = DateTime.UtcNow;
        }

        private decimal GetMockRate(string fromCurrency, string toCurrency)
        {
            var mockRates = new Dictionary<string, decimal>
            {
                { "TRY", 1.0m },
                { "USD", 34.50m },
                { "EUR", 37.20m },
                { "GBP", 43.50m }
            };

            if (mockRates.ContainsKey(fromCurrency) && mockRates.ContainsKey(toCurrency))
            {
                return mockRates[toCurrency] / mockRates[fromCurrency];
            }

            return 1.0m;
        }
    }

}
