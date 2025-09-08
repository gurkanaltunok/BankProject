using BankProject.Business.Abstract;
using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.Business.Concrete
{
    public class AccountManager : IAccountService
    {
        private readonly IAccountRepository _accountRepository;
        public AccountManager(IAccountRepository accountRepository)
        {
            _accountRepository = accountRepository;
        }
        public Account CreateAccount(Account account)
        {
            return _accountRepository.CreateAccount(account);
        }

        public bool DeleteAccount(int id)
        {
            return _accountRepository.DeleteAccount(id);
        }

        public Account GetAccountById(int id)
        {
            return _accountRepository.GetAccountById(id);
        }

        public List<Account> GetAllAccounts()
        {
            return _accountRepository.GetAllAccounts();
        }

        public List<Account> GetAccountsByUserId(int userId)
        {
            return _accountRepository.GetAccountsByUserId(userId);
        }

        public Account GetAccountByIban(string iban)
        {
            return _accountRepository.GetAccountByIban(iban);
        }

        public Account UpdateAccount(Account account)
        {
            return _accountRepository.UpdateAccount(account);
        }
    }
}
