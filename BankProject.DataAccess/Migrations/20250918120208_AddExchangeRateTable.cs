using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BankProject.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddExchangeRateTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExchangeRateId",
                table: "Transactions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FeeInTRY",
                table: "Transactions",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ExchangeRates",
                columns: table => new
                {
                    ExchangeRateId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FromCurrency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    ToCurrency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    Rate = table.Column<decimal>(type: "decimal(18,6)", precision: 18, scale: 6, nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExchangeRates", x => x.ExchangeRateId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_ExchangeRateId",
                table: "Transactions",
                column: "ExchangeRateId");

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRates_FromCurrency_ToCurrency_Date",
                table: "ExchangeRates",
                columns: new[] { "FromCurrency", "ToCurrency", "Date" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_ExchangeRates_ExchangeRateId",
                table: "Transactions",
                column: "ExchangeRateId",
                principalTable: "ExchangeRates",
                principalColumn: "ExchangeRateId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_ExchangeRates_ExchangeRateId",
                table: "Transactions");

            migrationBuilder.DropTable(
                name: "ExchangeRates");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_ExchangeRateId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "ExchangeRateId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "FeeInTRY",
                table: "Transactions");
        }
    }
}
