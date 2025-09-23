using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BankProject.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class UpdateExchangeRateTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ExchangeRates_FromCurrency_ToCurrency_Date",
                table: "ExchangeRates");

            migrationBuilder.DropColumn(
                name: "FromCurrency",
                table: "ExchangeRates");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "ExchangeRates");

            migrationBuilder.RenameColumn(
                name: "ToCurrency",
                table: "ExchangeRates",
                newName: "Currency");

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRates_Currency_Date",
                table: "ExchangeRates",
                columns: new[] { "Currency", "Date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ExchangeRates_Currency_Date",
                table: "ExchangeRates");

            migrationBuilder.RenameColumn(
                name: "Currency",
                table: "ExchangeRates",
                newName: "ToCurrency");

            migrationBuilder.AddColumn<string>(
                name: "FromCurrency",
                table: "ExchangeRates",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "ExchangeRates",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRates_FromCurrency_ToCurrency_Date",
                table: "ExchangeRates",
                columns: new[] { "FromCurrency", "ToCurrency", "Date" },
                unique: true);
        }
    }
}
