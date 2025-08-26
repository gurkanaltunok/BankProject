using BankProject.Business.Abstract;
using BankProject.DataAccess.Abstract;
using BankProject.Entities;

public class UserManager : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserManager(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public User CreateUser(User user)
    {
        return _userRepository.CreateUser(user);
    }

    public void DeleteUser(int id)
    {
        _userRepository.DeleteUser(id);
    }

    public List<User> GetAllUsers()
    {
        return _userRepository.GetAllUsers();
    }

    public User GetUserById(int id)
    {
        if (id <= 0)
            throw new ArgumentException("Invalid user ID");

        return _userRepository.GetUserById(id);
    }

    public User UpdateUser(User user)
    {
        return _userRepository.UpdateUser(user);
    }
}
