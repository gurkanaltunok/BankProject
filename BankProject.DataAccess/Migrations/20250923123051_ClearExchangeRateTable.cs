using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BankProject.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class ClearExchangeRateTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM ExchangeRates");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Bu migration geri alınamaz - silinen veriler geri getirilemez
            throw new NotSupportedException("Veri silme migration'ı geri alınamaz.");
        }
    }
}
