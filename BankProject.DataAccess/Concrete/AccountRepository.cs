using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.DataAccess.Concrete
{
    public class AccountRepository : IAccountRepository
    {
        private readonly BankDbContext _context;
        public AccountRepository(BankDbContext context)
        {
            _context = context;
        }
        public Account CreateAccount(Account account)
        {
            _context.Accounts.Add(account);
            _context.SaveChanges();
            return account;
        }

        public bool DeleteAccount(int id)
        {
            var account = _context.Accounts.Find(id);
            if (account != null)
            {
                account.IsActive = false;
                _context.SaveChanges();
                return true;
            }
            return false;
        }

        public Account GetAccountById(int id)
        {
            var account = _context.Accounts.Find(id);
            if (account == null)
            {
                throw new Exception("Hesap bulunamadı");
                
            }
            return account;
        }

        public List<Account> GetAllAccounts()
        {
            return _context.Accounts.ToList();
        }

        public Account UpdateAccount(Account account)
        {
            var existingAccount = _context.Accounts.Find(account.AccountId);
            if (existingAccount == null)
            {
                throw new Exception("Hesap bulunamadı");
            }
            existingAccount.Balance = account.Balance;
            existingAccount.CurrencyType = account.CurrencyType;
            existingAccount.UserId = account.UserId;
            existingAccount.IsActive = account.IsActive;
            _context.SaveChanges();
            return existingAccount;
        }
    }
}
