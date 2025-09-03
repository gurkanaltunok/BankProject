namespace BankProject.Business.DTOs
{
    public class AuthResultDTO
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public string? Token { get; set; }
        public int UserId { get; set; }
        public int RoleId { get; set; }
    }
}
