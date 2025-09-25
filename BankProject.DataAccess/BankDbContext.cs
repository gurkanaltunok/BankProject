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
        public DbSet<Address> Addresses { get; set; } = null!;
        public DbSet<ExchangeRate> ExchangeRates { get; set; } = null!;

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

            modelBuilder.Entity<User>()
                .Property(u => u.RegisterDate)
                .HasDefaultValueSql("GETUTCDATE()");

            // ExchangeRate konfigürasyonu
            modelBuilder.Entity<ExchangeRate>()
                .Property(e => e.UsdRate)
                .HasPrecision(18, 6);

            modelBuilder.Entity<ExchangeRate>()
                .Property(e => e.EurRate)
                .HasPrecision(18, 6);

            modelBuilder.Entity<ExchangeRate>()
                .Property(e => e.GbpRate)
                .HasPrecision(18, 6);

            modelBuilder.Entity<ExchangeRate>()
                .HasIndex(e => e.Date)
                .IsUnique();

            // Transaction - ExchangeRate ilişkisi
            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.ExchangeRate)
                .WithMany()
                .HasForeignKey(t => t.ExchangeRateId)
                .OnDelete(DeleteBehavior.SetNull);

        }
    }
}
