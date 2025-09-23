using System;
using System.Collections.Generic;

namespace BankProject.Business.DTOs
{
    public class VakifbankCurrencyRequestDTO
    {
        public string ValidityDate { get; set; } = string.Empty;
    }

    public class VakifbankCurrencyResponseDTO
    {
        public VakifbankHeader Header { get; set; } = new();
        public VakifbankData Data { get; set; } = new();
    }

    public class VakifbankHeader
    {
        public string StatusCode { get; set; } = string.Empty;
        public string StatusDescription { get; set; } = string.Empty;
        public string ObjectID { get; set; } = string.Empty;
    }

    public class VakifbankData
    {
        public List<VakifbankCurrency> Currency { get; set; } = new();
    }

    public class VakifbankCurrency
    {
        public string CurrencyCode { get; set; } = string.Empty;
        public string RateDate { get; set; } = string.Empty;
        public decimal SaleRate { get; set; }
        public decimal PurchaseRate { get; set; }
    }
}
