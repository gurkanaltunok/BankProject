using BankProject.Business.DTOs;

namespace BankProject.Business.Abstract
{
    public interface IAuthService
    {
        AuthResultDTO Register(UserRegisterDTO dto);
        AuthResultDTO Login(LoginDTO dto);
    }
}
