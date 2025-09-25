using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BankProject.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddUserRegisterDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RegisterDate",
                table: "Users",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RegisterDate",
                table: "Users");
        }
    }
}
