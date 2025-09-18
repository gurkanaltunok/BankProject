using BankProject.Business.Abstract;
using BankProject.Business.DTOs;
using BankProject.DataAccess.Abstract;
using BankProject.Entities;

namespace BankProject.Business.Concrete
{
    public class AddressService : IAddressService
    {
        private readonly IAddressRepository _addressRepository;

        public AddressService(IAddressRepository addressRepository)
        {
            _addressRepository = addressRepository;
        }

        public AddressDTO CreateAddress(CreateAddressDTO dto)
        {
            var address = new Address
            {
                Country = dto.Country,
                City = dto.City,
                District = dto.District,
                Neighborhood = dto.Neighborhood,
                AddressDetail = dto.AddressDetail,
                UserId = dto.UserId,
                CreatedAt = DateTime.UtcNow
            };

            var createdAddress = _addressRepository.Add(address);

            return new AddressDTO
            {
                AddressId = createdAddress.AddressId,
                Country = createdAddress.Country,
                City = createdAddress.City,
                District = createdAddress.District,
                Neighborhood = createdAddress.Neighborhood,
                AddressDetail = createdAddress.AddressDetail,
                UserId = createdAddress.UserId
            };
        }

        public AddressDTO UpdateAddress(int addressId, CreateAddressDTO dto)
        {
            var address = _addressRepository.GetById(addressId);
            if (address == null)
                throw new ArgumentException("Adres bulunamadı");

            address.Country = dto.Country;
            address.City = dto.City;
            address.District = dto.District;
            address.Neighborhood = dto.Neighborhood;
            address.AddressDetail = dto.AddressDetail;
            address.UpdatedAt = DateTime.UtcNow;

            var updatedAddress = _addressRepository.Update(address);

            return new AddressDTO
            {
                AddressId = updatedAddress.AddressId,
                Country = updatedAddress.Country,
                City = updatedAddress.City,
                District = updatedAddress.District,
                Neighborhood = updatedAddress.Neighborhood,
                AddressDetail = updatedAddress.AddressDetail,
                UserId = updatedAddress.UserId
            };
        }

        public AddressDTO GetAddressById(int addressId)
        {
            var address = _addressRepository.GetById(addressId);
            if (address == null)
                return null;

            return new AddressDTO
            {
                AddressId = address.AddressId,
                Country = address.Country,
                City = address.City,
                District = address.District,
                Neighborhood = address.Neighborhood,
                AddressDetail = address.AddressDetail,
                UserId = address.UserId
            };
        }

        public AddressDTO GetAddressByUserId(int userId)
        {
            var address = _addressRepository.GetByUserId(userId);
            if (address == null)
                return null;

            return new AddressDTO
            {
                AddressId = address.AddressId,
                Country = address.Country,
                City = address.City,
                District = address.District,
                Neighborhood = address.Neighborhood,
                AddressDetail = address.AddressDetail,
                UserId = address.UserId
            };
        }

        public void DeleteAddress(int addressId)
        {
            _addressRepository.Delete(addressId);
        }

        public List<AddressDTO> GetAllAddresses()
        {
            var addresses = _addressRepository.GetAll();
            return addresses.Select(a => new AddressDTO
            {
                AddressId = a.AddressId,
                Country = a.Country,
                City = a.City,
                District = a.District,
                Neighborhood = a.Neighborhood,
                AddressDetail = a.AddressDetail,
                UserId = a.UserId
            }).ToList();
        }
    }
}
