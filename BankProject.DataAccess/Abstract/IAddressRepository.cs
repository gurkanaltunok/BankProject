using BankProject.Entities;

namespace BankProject.DataAccess.Abstract
{
    public interface IAddressRepository
    {
        Address Add(Address address);
        Address Update(Address address);
        Address GetById(int addressId);
        Address GetByUserId(int userId);
        void Delete(int addressId);
        List<Address> GetAll();
    }
}
