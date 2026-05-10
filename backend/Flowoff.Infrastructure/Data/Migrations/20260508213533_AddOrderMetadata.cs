using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowoff.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FloristId",
                table: "Orders",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrderNumber",
                table: "Orders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                """
                ;WITH Ordered AS (
                    SELECT Id, ROW_NUMBER() OVER (ORDER BY CreatedAtUtc, Id) AS RowNum
                    FROM Orders
                )
                UPDATE Orders
                SET OrderNumber = Ordered.RowNum
                FROM Orders
                INNER JOIN Ordered ON Orders.Id = Ordered.Id
                """
            );

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderNumber",
                table: "Orders",
                column: "OrderNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_OrderNumber",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "FloristId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OrderNumber",
                table: "Orders");
        }
    }
}
