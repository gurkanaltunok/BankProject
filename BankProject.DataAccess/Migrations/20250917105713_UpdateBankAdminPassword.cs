using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BankProject.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBankAdminPassword : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Bank Admin kullanıcısının şifresini 123456 olarak güncelle
            migrationBuilder.Sql(@"
                UPDATE [Users]
                SET [PasswordHash] = 0xBCA5B8507E8022538C97632386C79DA7D3364330B0CD743C136C6D3E4D3AC89F0332F6BA9D0AEFF211A1D14C48FBDADB08D7C0B27826DE8D6C25E05AC6FA7FFF,
                    [PasswordSalt] = 0x279B54F0F2051BED74F582DDB25466E5D63FB13FC62694B9858B56CB4B9C0A45055449D9469AA79CA3A8760CFC69218E46E98B570ED92F851113246EB46AAA2466B9F257FB2E7DA6297D6633FA2BFAC0A3ADD8D69AE333D9F48BA3BA20DAF721F708EBE57C5EEA0303AAB7F9DC0C3132661732FEAC8936CC3F9241BECB5CA466
                WHERE [Id] = 1;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Bu migration geri alınamaz - şifre hash'leri geri alınamaz
            throw new NotSupportedException("Şifre migration'ı geri alınamaz.");
        }
    }
}
