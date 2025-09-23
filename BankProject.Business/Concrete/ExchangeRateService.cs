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
                    // ExchangeRate-API kurları TRY cinsinden olduğu için:
                    // fromCurrency -> TRY -> toCurrency dönüşümü yapıyoruz
                    decimal rate;
                    
                    if (fromCurrency == "TRY")
                    {
                        // TRY'den başka para birimine: 1 / kur
                        rate = 1.0m / rates[toCurrency];
                    }
                    else if (toCurrency == "TRY")
                    {
                        // Başka para biriminden TRY'ye: kur
                        rate = rates[fromCurrency];
                    }
                    else
                    {
                        // İki yabancı para birimi arasında: fromCurrency -> TRY -> toCurrency
                        rate = rates[fromCurrency] / rates[toCurrency];
                    }
                    
                    Console.WriteLine($"DEBUG: ConvertCurrency (ExchangeRate-API) - {amount} {fromCurrency} to {toCurrency} = {amount * rate} (rate: {rate})");
                    return amount * rate;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exchange rate API error: {ex.Message}");
            }

            // API çalışmadığında hata fırlat
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
                // Frankfurter API'den USD bazlı kurları al
                var url = $"{_baseUrl}/latest?base=USD&symbols=TRY,EUR,GBP";
                var response = await _httpClient.GetStringAsync(url);
                var jsonDoc = JsonDocument.Parse(response);
                
                if (jsonDoc.RootElement.TryGetProperty("rates", out var ratesElement))
                {
                    _cachedRates = new Dictionary<string, decimal>();
                    
                    // USD bazlı kurları al
                    var usdToTry = ratesElement.GetProperty("TRY").GetDecimal();
                    var usdToEur = ratesElement.GetProperty("EUR").GetDecimal();
                    var usdToGbp = ratesElement.GetProperty("GBP").GetDecimal();
                    
                    // TRY bazlı kurları hesapla
                    _cachedRates["USD"] = usdToTry; // 1 USD = X TRY
                    _cachedRates["EUR"] = usdToTry / usdToEur; // 1 EUR = X TRY
                    _cachedRates["GBP"] = usdToTry / usdToGbp; // 1 GBP = X TRY
                    _cachedRates["TRY"] = 1.0m; // 1 TRY = 1 TRY
                    
                    _lastUpdate = DateTime.UtcNow;
                    Console.WriteLine($"Frankfurter API'den {_cachedRates.Count} döviz kuru başarıyla alındı.");
                    Console.WriteLine($"USD: {_cachedRates["USD"]}, EUR: {_cachedRates["EUR"]}, GBP: {_cachedRates["GBP"]}");
                    
                    // Günlük kurları veritabanına kaydet
                    await SaveDailyRatesToDatabase();
                    
                    return;
                }
                
                Console.WriteLine($"Frankfurter API error: {jsonDoc.RootElement.GetRawText()}");
                _cachedRates = new Dictionary<string, decimal>(); // Clear rates on API error
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Frankfurter API error: {ex.Message}");
                _cachedRates = new Dictionary<string, decimal>(); // Clear rates on exception
            }
        }

        private void SetMockRates()
        {
            // Sabit kurları kaldırdık - API çalışmadığında boş döner
            _cachedRates = new Dictionary<string, decimal>();
            _lastUpdate = DateTime.UtcNow;
        }

        private decimal GetMockRate(string fromCurrency, string toCurrency)
        {
            // Sabit kurları kaldırdık - API çalışmadığında 1.0 döner
            return 1.0m;
        }

        private async Task SaveDailyRatesToDatabase()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                
                // Bugün için zaten kayıt var mı kontrol et
                var todayRates = _exchangeRateRepository.GetExchangeRatesByDate(today);
                if (todayRates.Any())
                {
                    Console.WriteLine("Bugün için döviz kurları zaten kaydedilmiş.");
                    return;
                }

                // Günlük kurları veritabanına kaydet
                var currencies = new[] { "USD", "EUR", "GBP" };
                foreach (var currency in currencies)
                {
                    if (_cachedRates.ContainsKey(currency))
                    {
                        var exchangeRate = new ExchangeRate
                        {
                            Currency = currency,
                            Rate = _cachedRates[currency],
                            Date = DateTime.UtcNow
                        };
                        
                        _exchangeRateRepository.AddExchangeRate(exchangeRate);
                        Console.WriteLine($"Günlük kur kaydedildi: {currency} = {_cachedRates[currency]} TRY");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Günlük kur kaydetme hatası: {ex.Message}");
            }
        }

        public async Task<Dictionary<string, decimal>> GetPreviousDayRatesAsync()
        {
            try
            {
                var previousDayRates = _exchangeRateRepository.GetPreviousDayExchangeRates();
                var rates = new Dictionary<string, decimal>();
                
                foreach (var rate in previousDayRates)
                {
                    rates[rate.Currency] = rate.Rate;
                }
                
                Console.WriteLine($"Önceki gün kurları alındı: {string.Join(", ", rates.Select(kv => $"{kv.Key}={kv.Value}"))}");
                return rates;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Önceki gün kurları alma hatası: {ex.Message}");
                return new Dictionary<string, decimal>();
            }
        }

        public async Task<Dictionary<string, decimal>> GetDailyRatesWithChangeAsync()
        {
            try
            {
                // Güncel kurları al
                await EnsureRatesAreFreshAsync();
                var currentRates = new Dictionary<string, decimal>(_cachedRates);
                
                // Önceki gün kurlarını al
                var previousRates = await GetPreviousDayRatesAsync();
                
                // Yüzdelik değişimi hesapla ve ekle
                var ratesWithChange = new Dictionary<string, decimal>();
                var currencies = new[] { "USD", "EUR", "GBP" };
                
                foreach (var currency in currencies)
                {
                    if (currentRates.ContainsKey(currency))
                    {
                        ratesWithChange[currency] = currentRates[currency];
                        
                        // Yüzdelik değişimi hesapla
                        if (previousRates.ContainsKey(currency) && previousRates[currency] > 0)
                        {
                            var change = ((currentRates[currency] - previousRates[currency]) / previousRates[currency]) * 100;
                            ratesWithChange[$"{currency}_CHANGE"] = change;
                            Console.WriteLine($"{currency} değişimi: {change:F2}% (Önceki: {previousRates[currency]}, Güncel: {currentRates[currency]})");
                        }
                        else
                        {
                            ratesWithChange[$"{currency}_CHANGE"] = 0; // Önceki gün verisi yoksa 0
                        }
                    }
                }
                
                return ratesWithChange;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Günlük kurlar ve değişim alma hatası: {ex.Message}");
                return new Dictionary<string, decimal>();
            }
        }
    }

}
