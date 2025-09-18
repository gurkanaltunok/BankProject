using BankProject.Business.DTOs;

namespace BankProject.Business.Abstract
{
    public interface IAddressService
    {
        AddressDTO CreateAddress(CreateAddressDTO dto);
        AddressDTO UpdateAddress(int addressId, CreateAddressDTO dto);
        AddressDTO GetAddressById(int addressId);
        AddressDTO GetAddressByUserId(int userId);
        void DeleteAddress(int addressId);
        List<AddressDTO> GetAllAddresses();
    }
}
