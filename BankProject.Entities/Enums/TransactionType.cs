using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.Entities.Enums
{
    public enum TransactionType
    {
        Deposit = 1,
        Withdraw = 2,
        Transfer = 3,
        Fee = 4,
        ExchangeBuy = 5,        // Döviz alış (TRY'den döviz alımı)
        ExchangeSell = 6,       // Döviz satış (dövizden TRY'ye çevirme)
        ExchangeCommission = 7, // Döviz komisyonu (sadece admin panelinde görünür)
        ExchangeDeposit = 8,    // Döviz hesabına para girişi (alış işleminde)
        ExchangeWithdraw = 9    // Döviz hesabından para çıkışı (satış işleminde)
    }
}
