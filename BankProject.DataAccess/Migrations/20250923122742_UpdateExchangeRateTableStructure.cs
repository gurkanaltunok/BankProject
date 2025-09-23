using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BankProject.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class UpdateExchangeRateTableStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ExchangeRates_Currency_Date",
                table: "ExchangeRates");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "ExchangeRates");

            migrationBuilder.RenameColumn(
                name: "Rate",
                table: "ExchangeRates",
                newName: "UsdRate");

            migrationBuilder.AddColumn<decimal>(
                name: "EurRate",
                table: "ExchangeRates",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GbpRate",
                table: "ExchangeRates",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRates_Date",
                table: "ExchangeRates",
                column: "Date",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ExchangeRates_Date",
                table: "ExchangeRates");

            migrationBuilder.DropColumn(
                name: "EurRate",
                table: "ExchangeRates");

            migrationBuilder.DropColumn(
                name: "GbpRate",
                table: "ExchangeRates");

            migrationBuilder.RenameColumn(
                name: "UsdRate",
                table: "ExchangeRates",
                newName: "Rate");

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "ExchangeRates",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRates_Currency_Date",
                table: "ExchangeRates",
                columns: new[] { "Currency", "Date" },
                unique: true);
        }
    }
}
