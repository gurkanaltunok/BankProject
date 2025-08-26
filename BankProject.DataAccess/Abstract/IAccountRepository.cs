using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.DataAccess.Abstract
{
    public interface IAccountRepository
    {
        List<Entities.Account> GetAllAccounts();
        Entities.Account GetAccountById(int id);
        Entities.Account CreateAccount(Entities.Account account);
        Entities.Account UpdateAccount(Entities.Account account);
        void DeleteAccount(int id);
    }
}
