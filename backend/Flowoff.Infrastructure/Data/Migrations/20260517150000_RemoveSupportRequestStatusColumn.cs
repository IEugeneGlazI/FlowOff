using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowoff.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSupportRequestStatusColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "SupportRequests");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "SupportRequests",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "Новое");

            migrationBuilder.Sql("""
                UPDATE sr
                SET sr.Status = ssr.Name
                FROM SupportRequests sr
                INNER JOIN SupportStatusReferences ssr ON ssr.Id = sr.SupportStatusReferenceId
                """);
        }
    }
}
