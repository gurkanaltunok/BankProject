using BankProject.Business.DTOs;
using BankProject.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BankProject.Business.Abstract
{
    public interface IUserService
    {
        List<User> GetAllUsers();
        User GetUserById(int id);
        User CreateUser(User user, string password);
        User UpdateUser(User user);
        void DeleteUser(int id);
        void ChangePassword(int userId, string newPassword);
        string Login(LoginDTO dto);
    }
}
