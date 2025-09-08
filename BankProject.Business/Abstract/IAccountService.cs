using BankProject.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.Business.Abstract
{
    public interface IAccountService
    {
        List<Account> GetAllAccounts();
        List<Account> GetAccountsByUserId(int userId);
        Account GetAccountById(int id);
        Account GetAccountByIban(string iban);
        Account CreateAccount(Account account);
        Account UpdateAccount(Account account);
        bool DeleteAccount(int id);
    }
}
