using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BankProject.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class RecreateExchangeRateTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Foreign key constraint'i kaldır
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_ExchangeRates_ExchangeRateId",
                table: "Transactions");

            // Mevcut tabloyu sil
            migrationBuilder.DropTable(
                name: "ExchangeRates");

            // Yeni tabloyu oluştur - doğru kolon sıralaması ile
            migrationBuilder.CreateTable(
                name: "ExchangeRates",
                columns: table => new
                {
                    ExchangeRateId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsdRate = table.Column<decimal>(type: "decimal(18,6)", precision: 18, scale: 6, nullable: false),
                    EurRate = table.Column<decimal>(type: "decimal(18,6)", precision: 18, scale: 6, nullable: false),
                    GbpRate = table.Column<decimal>(type: "decimal(18,6)", precision: 18, scale: 6, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExchangeRates", x => x.ExchangeRateId);
                });

            // Unique index ekle
            migrationBuilder.CreateIndex(
                name: "IX_ExchangeRates_Date",
                table: "ExchangeRates",
                column: "Date",
                unique: true);

            // Foreign key constraint'i yeniden ekle
            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_ExchangeRates_ExchangeRateId",
                table: "Transactions",
                column: "ExchangeRateId",
                principalTable: "ExchangeRates",
                principalColumn: "ExchangeRateId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Foreign key constraint'i kaldır
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_ExchangeRates_ExchangeRateId",
                table: "Transactions");

            // Tabloyu sil
            migrationBuilder.DropTable(
                name: "ExchangeRates");

            // Eski tablo yapısını geri getir (basit yapı)
            migrationBuilder.CreateTable(
                name: "ExchangeRates",
                columns: table => new
                {
                    ExchangeRateId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    Rate = table.Column<decimal>(type: "decimal(18,6)", precision: 18, scale: 6, nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExchangeRates", x => x.ExchangeRateId);
                });

            // Foreign key constraint'i yeniden ekle
            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_ExchangeRates_ExchangeRateId",
                table: "Transactions",
                column: "ExchangeRateId",
                principalTable: "ExchangeRates",
                principalColumn: "ExchangeRateId");
        }
    }
}
