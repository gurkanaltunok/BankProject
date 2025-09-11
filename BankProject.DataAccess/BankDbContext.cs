using Microsoft.EntityFrameworkCore;
using BankProject.Entities;

namespace BankProject.DataAccess
{
    public class BankDbContext : DbContext
    {
        public BankDbContext(DbContextOptions<BankDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Role> Roles { get; set; } = null!;
        public DbSet<Account> Accounts { get; set; } = null!;
        public DbSet<Transaction> Transactions { get; set; } = null!;
        public DbSet<BalanceHistory> BalanceHistories { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Role>().HasData(
                new Role { RoleId = 1, RoleName = "Customer" },
                new Role { RoleId = 2, RoleName = "Admin" }
            );

            modelBuilder.Entity<Account>()
                .Property(a => a.Balance)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Account>()
                .HasIndex(a => a.IBAN)
                .IsUnique();

            modelBuilder.Entity<Account>()
                .Property(a => a.CurrencyType)
                .HasConversion<int>();

            modelBuilder.Entity<Account>()
                .Property(a => a.AccountType)
                .HasConversion<int>();


            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<BalanceHistory>()
                .Property(b => b.Balance)
                .HasPrecision(18, 2);

            modelBuilder.Entity<BalanceHistory>()
                .Property(b => b.PreviousBalance)
                .HasPrecision(18, 2);

            modelBuilder.Entity<BalanceHistory>()
                .Property(b => b.ChangeAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<User>()
                .Property(u => u.RoleId)
                .HasDefaultValue(1);

        }
    }
}
