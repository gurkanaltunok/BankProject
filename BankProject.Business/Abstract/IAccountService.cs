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
        Account GetAccountById(int id);
        Account CreateAccount(Account account);
        Account UpdateAccount(Account account);
        void DeleteAccount(int id);
    }
}
