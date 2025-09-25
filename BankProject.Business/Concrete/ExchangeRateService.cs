using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using BankProject.Business.Abstract;
using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using System.Linq;

namespace BankProject.Business.Concrete
{
    public class ExchangeRateService : IExchangeRateService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly IExchangeRateRepository _exchangeRateRepository;
        private Dictionary<string, decimal> _cachedRates;
        private DateTime _lastUpdate;
        private readonly TimeSpan _cacheExpiry = TimeSpan.FromMinutes(1); // 1 dakika cache
        private string _baseUrl;

        public ExchangeRateService(HttpClient httpClient, IConfiguration configuration, IExchangeRateRepository exchangeRateRepository)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _exchangeRateRepository = exchangeRateRepository;
            _cachedRates = new Dictionary<string, decimal>();
            _baseUrl = _configuration["ExchangeRateApi:BaseUrl"] ?? "https://api.frankfurter.dev/v1";
        }

        public async Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency)
        {
            if (fromCurrency == toCurrency)
                return 1.0m;

            await EnsureRatesAreFreshAsync();

            var key = $"{fromCurrency}_TO_{toCurrency}";
            if (_cachedRates.ContainsKey(key))
                return _cachedRates[key];

            if (_cachedRates.ContainsKey(fromCurrency) && _cachedRates.ContainsKey(toCurrency))
            {
                var fromRate = _cachedRates[fromCurrency];
                var toRate = _cachedRates[toCurrency];
                var rate = toRate / fromRate;
                _cachedRates[key] = rate;
                return rate;
            }

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
                var rates = GetAllRatesAsync().Result;
                
                if (rates.ContainsKey(fromCurrency) && rates.ContainsKey(toCurrency))
                {
                    decimal rate;
                    
                    if (fromCurrency == "TRY")
                    {
                        rate = 1.0m / rates[toCurrency];
                    }
                    else if (toCurrency == "TRY")
                    {
                        rate = rates[fromCurrency];
                    }
                    else
                    {
                        rate = rates[fromCurrency] / rates[toCurrency];
                    }
                    
                    return amount * rate;
                }
            }
            catch (Exception)
            {
            }

            throw new Exception($"Frankfurter API erişilemiyor. {fromCurrency} -> {toCurrency} dönüşümü yapılamıyor.");
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
                var url = $"{_baseUrl}/latest?base=USD&symbols=TRY,EUR,GBP";
                var response = await _httpClient.GetStringAsync(url);
                var jsonDoc = JsonDocument.Parse(response);
                
                if (jsonDoc.RootElement.TryGetProperty("rates", out var ratesElement))
                {
                    _cachedRates = new Dictionary<string, decimal>();
                    
                    var usdToTry = ratesElement.GetProperty("TRY").GetDecimal();
                    var usdToEur = ratesElement.GetProperty("EUR").GetDecimal();
                    var usdToGbp = ratesElement.GetProperty("GBP").GetDecimal();
                    
                    _cachedRates["USD"] = usdToTry; // 1 USD = X TRY
                    _cachedRates["EUR"] = usdToTry / usdToEur; // 1 EUR = X TRY
                    _cachedRates["GBP"] = usdToTry / usdToGbp; // 1 GBP = X TRY
                    _cachedRates["TRY"] = 1.0m; // 1 TRY = 1 TRY
                    
                    _lastUpdate = DateTime.UtcNow;
                    
                    await SaveDailyRatesToDatabase();
                    
                    return;
                }
                
                _cachedRates = new Dictionary<string, decimal>(); // Clear rates on API error
            }
            catch (Exception)
            {
                _cachedRates = new Dictionary<string, decimal>(); // Clear rates on exception
            }
        }

        private void SetMockRates()
        {
            _cachedRates = new Dictionary<string, decimal>();
            _lastUpdate = DateTime.UtcNow;
        }

        private decimal GetMockRate(string fromCurrency, string toCurrency)
        {
            return 1.0m;
        }

        private Task SaveDailyRatesToDatabase()
        {
            try
            {
                // Türkiye saati (GMT+3)
                var turkeyTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time"));
                var today = turkeyTime.Date;
                
                var todayRates = _exchangeRateRepository.GetExchangeRatesByDate(today);
                if (todayRates.Any())
                {
                    return Task.CompletedTask;
                }

                // Tüm currency'lerin kurlarını tek satırda kaydet
                if (_cachedRates.ContainsKey("USD") && _cachedRates.ContainsKey("EUR") && _cachedRates.ContainsKey("GBP"))
                {
                    var exchangeRate = new ExchangeRate
                    {
                        UsdRate = _cachedRates["USD"],
                        EurRate = _cachedRates["EUR"],
                        GbpRate = _cachedRates["GBP"],
                        Date = turkeyTime
                    };
                    
                    _exchangeRateRepository.AddExchangeRate(exchangeRate);
                }
            }
            catch (Exception)
            {
            }

            return Task.CompletedTask;
        }

        public Task<Dictionary<string, decimal>> GetPreviousDayRatesAsync()
        {
            try
            {
                var previousDayRates = _exchangeRateRepository.GetPreviousDayExchangeRates();
                var rates = new Dictionary<string, decimal>();
                
                if (previousDayRates.Any())
                {
                    var latestRate = previousDayRates.First();
                    rates["USD"] = latestRate.UsdRate;
                    rates["EUR"] = latestRate.EurRate;
                    rates["GBP"] = latestRate.GbpRate;
                }
                
                return Task.FromResult(rates);
            }
            catch (Exception)
            {
                return Task.FromResult(new Dictionary<string, decimal>());
            }
        }

        public async Task<Dictionary<string, decimal>> GetDailyRatesWithChangeAsync()
        {
            try
            {
                await EnsureRatesAreFreshAsync();
                var currentRates = new Dictionary<string, decimal>(_cachedRates);
                
                var previousRates = await GetPreviousDayRatesAsync();
                
                var ratesWithChange = new Dictionary<string, decimal>();
                var currencies = new[] { "USD", "EUR", "GBP" };
                
                foreach (var currency in currencies)
                {
                    if (currentRates.ContainsKey(currency))
                    {
                        ratesWithChange[currency] = currentRates[currency];
                        
                        if (previousRates.ContainsKey(currency) && previousRates[currency] > 0)
                        {
                            var change = ((currentRates[currency] - previousRates[currency]) / previousRates[currency]) * 100;
                            ratesWithChange[$"{currency}_CHANGE"] = change;
                        }
                        else
                        {
                            ratesWithChange[$"{currency}_CHANGE"] = 0; // Önceki gün verisi yoksa 0
                        }
                    }
                }
                
                return ratesWithChange;
            }
            catch (Exception)
            {
                return new Dictionary<string, decimal>();
            }
        }
    }

}