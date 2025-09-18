using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace BankProject.DataAccess
{
    public class BankDbContextFactory : IDesignTimeDbContextFactory<BankDbContext>
    {
        public BankDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<BankDbContext>();
            optionsBuilder.UseSqlServer("Server=localhost,1433;Database=BankProjectDb;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=true;");

            return new BankDbContext(optionsBuilder.Options);
        }
    }
}
