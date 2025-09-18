using BankProject.DataAccess.Abstract;
using BankProject.Entities;

namespace BankProject.DataAccess.Concrete
{
    public class AddressRepository : IAddressRepository
    {
        private readonly BankDbContext _context;

        public AddressRepository(BankDbContext context)
        {
            _context = context;
        }

        public Address Add(Address address)
        {
            _context.Addresses.Add(address);
            _context.SaveChanges();
            return address;
        }

        public Address Update(Address address)
        {
            _context.Addresses.Update(address);
            _context.SaveChanges();
            return address;
        }

        public Address GetById(int addressId)
        {
            return _context.Addresses.FirstOrDefault(a => a.AddressId == addressId);
        }

        public Address GetByUserId(int userId)
        {
            return _context.Addresses.FirstOrDefault(a => a.UserId == userId);
        }

        public void Delete(int addressId)
        {
            var address = _context.Addresses.Find(addressId);
            if (address != null)
            {
                _context.Addresses.Remove(address);
                _context.SaveChanges();
            }
        }

        public List<Address> GetAll()
        {
            return _context.Addresses.ToList();
        }
    }
}
