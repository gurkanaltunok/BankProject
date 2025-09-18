using Microsoft.AspNetCore.Mvc;
using BankProject.Business.Abstract;
using BankProject.Business.DTOs;

namespace BankProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AddressController : ControllerBase
    {
        private readonly IAddressService _addressService;

        public AddressController(IAddressService addressService)
        {
            _addressService = addressService;
        }

        [HttpGet("{id}")]
        public IActionResult GetAddress(int id)
        {
            try
            {
                var address = _addressService.GetAddressById(id);
                if (address == null)
                    return NotFound();

                return Ok(address);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetAddressByUserId(int userId)
        {
            try
            {
                var address = _addressService.GetAddressByUserId(userId);
                if (address == null)
                    return NotFound();

                return Ok(address);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult CreateAddress([FromBody] CreateAddressDTO dto)
        {
            try
            {
                var address = _addressService.CreateAddress(dto);
                return CreatedAtAction(nameof(GetAddress), new { id = address.AddressId }, address);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public IActionResult UpdateAddress(int id, [FromBody] CreateAddressDTO dto)
        {
            try
            {
                var address = _addressService.UpdateAddress(id, dto);
                return Ok(address);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteAddress(int id)
        {
            try
            {
                _addressService.DeleteAddress(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetAllAddresses()
        {
            try
            {
                var addresses = _addressService.GetAllAddresses();
                return Ok(addresses);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}
