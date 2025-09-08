using BankProject.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.DataAccess.Abstract
{
    public interface IUserRepository
    {
        List<User> GetAllUsers();
        User GetUserById(int id);
        User CreateUser(User user);
        User UpdateUser(User user);
        void DeleteUser(int id);
        void ChangePassword(int userId, byte[] newHash, byte[] newSalt);

        User? GetByTCKN(string tckn);


    }
}
