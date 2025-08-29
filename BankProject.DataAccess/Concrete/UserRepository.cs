using BankProject.DataAccess.Abstract;
using BankProject.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

namespace BankProject.DataAccess.Concrete
{
    public class UserRepository : IUserRepository
    {
        private readonly BankDbContext _context;

        public UserRepository(BankDbContext context)
        {
            _context = context;
        }

        public User CreateUser(User user)
        {
            _context.Users.Add(user);
            _context.SaveChanges();
            return user;
        }

        public void DeleteUser(int id)
        {
            var user = _context.Users.Find(id);
            if (user != null)
            {
                _context.Users.Remove(user);
                _context.SaveChanges();
            }
        }

        public List<User> GetAllUsers()
        {
            return _context.Users.ToList();
        }

        public User GetUserById(int id)
        {
            var user = _context.Users.Find(id);
            if (user == null)
                throw new Exception("User not found");
            return user;
        }

        public User UpdateUser(User user)
        {
            var existingUser = _context.Users.Find(user.Id);
            if (existingUser == null)
                throw new Exception("User not found");

            existingUser.TCKN = user.TCKN;
            existingUser.Name = user.Name;
            existingUser.Surname = user.Surname;
            existingUser.Email = user.Email;
            existingUser.Address = user.Address;
            existingUser.PhoneNumber = user.PhoneNumber;
            existingUser.RoleId = user.RoleId;

            _context.SaveChanges();
            return existingUser;
        }

        public User? GetByTCKN(string tckn)
        {
            return _context.Users.FirstOrDefault(u => u.TCKN == tckn);
        }

        public void ChangePassword(int userId, byte[] passwordHash, byte[] passwordSalt)
        {
            var user = _context.Users.Find(userId);
            if (user == null)
                throw new Exception("User not found");

            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;

            _context.SaveChanges();
        }
    }
}
