using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BankProject.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class BackfillRegisterDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE U
                SET RegisterDate = COALESCE(
                    (SELECT MIN(A.DateCreated) FROM Accounts A WHERE A.UserId = U.Id),
                    GETUTCDATE()
                )
                FROM Users U
                WHERE U.RegisterDate IS NULL OR U.RegisterDate = '0001-01-01T00:00:00.000';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
