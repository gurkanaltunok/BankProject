using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BankProject.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class SetBankUserPassword : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Banka kullanıcısına şifre ekle (şifre: bank123)
            migrationBuilder.Sql(@"
                UPDATE [Users] 
                SET [PasswordHash] = 0x47D969D4CFAF630A0D888D47EF997A2E602CF4A9158E8262AFC0859A2EA47D93D1A37F87E9D2AD900204B96E7D759CAC6F63707D73E1F85B6DCDA69EC65551F7,
                    [PasswordSalt] = 0xA3C78CC48C01BABA90274BB04787BE6646141FD52D290364036EFFB3CE51E00C08050302CE320E8E797122EE572AED5BBDFC9A0DB3314E65D6192DDF24BE6C73A69CF7145E65E6849F5C1E225AC2DB05FDAF652C9693454A0D0A437DD100D333317F9E0875DF0EBC0E434CA72BB0D5B80AA31A563F8A2626A242D6FCD84BB6EC
                WHERE [Id] = 1;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Banka kullanıcısının şifresini sıfırla
            migrationBuilder.Sql(@"
                UPDATE [Users] 
                SET [PasswordHash] = 0x,
                    [PasswordSalt] = 0x
                WHERE [Id] = 1;
            ");
        }
    }
}
