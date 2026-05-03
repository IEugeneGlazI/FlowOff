using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowoff.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixCartItemIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_BouquetId_FlowerId_GiftId",
                table: "CartItems");

            migrationBuilder.Sql("""
                ;WITH DuplicateCartItems AS
                (
                    SELECT
                        Id,
                        SUM(Quantity) OVER (PARTITION BY CartId, BouquetId) AS TotalQuantity,
                        ROW_NUMBER() OVER (PARTITION BY CartId, BouquetId ORDER BY Id) AS RowNumber
                    FROM CartItems
                    WHERE BouquetId IS NOT NULL
                )
                UPDATE cartItem
                SET Quantity = duplicate.TotalQuantity
                FROM CartItems AS cartItem
                INNER JOIN DuplicateCartItems AS duplicate ON duplicate.Id = cartItem.Id
                WHERE duplicate.RowNumber = 1;

                ;WITH DuplicateCartItems AS
                (
                    SELECT
                        Id,
                        ROW_NUMBER() OVER (PARTITION BY CartId, BouquetId ORDER BY Id) AS RowNumber
                    FROM CartItems
                    WHERE BouquetId IS NOT NULL
                )
                DELETE cartItem
                FROM CartItems AS cartItem
                INNER JOIN DuplicateCartItems AS duplicate ON duplicate.Id = cartItem.Id
                WHERE duplicate.RowNumber > 1;
                """);

            migrationBuilder.Sql("""
                ;WITH DuplicateCartItems AS
                (
                    SELECT
                        Id,
                        SUM(Quantity) OVER (PARTITION BY CartId, FlowerId) AS TotalQuantity,
                        ROW_NUMBER() OVER (PARTITION BY CartId, FlowerId ORDER BY Id) AS RowNumber
                    FROM CartItems
                    WHERE FlowerId IS NOT NULL
                )
                UPDATE cartItem
                SET Quantity = duplicate.TotalQuantity
                FROM CartItems AS cartItem
                INNER JOIN DuplicateCartItems AS duplicate ON duplicate.Id = cartItem.Id
                WHERE duplicate.RowNumber = 1;

                ;WITH DuplicateCartItems AS
                (
                    SELECT
                        Id,
                        ROW_NUMBER() OVER (PARTITION BY CartId, FlowerId ORDER BY Id) AS RowNumber
                    FROM CartItems
                    WHERE FlowerId IS NOT NULL
                )
                DELETE cartItem
                FROM CartItems AS cartItem
                INNER JOIN DuplicateCartItems AS duplicate ON duplicate.Id = cartItem.Id
                WHERE duplicate.RowNumber > 1;
                """);

            migrationBuilder.Sql("""
                ;WITH DuplicateCartItems AS
                (
                    SELECT
                        Id,
                        SUM(Quantity) OVER (PARTITION BY CartId, GiftId) AS TotalQuantity,
                        ROW_NUMBER() OVER (PARTITION BY CartId, GiftId ORDER BY Id) AS RowNumber
                    FROM CartItems
                    WHERE GiftId IS NOT NULL
                )
                UPDATE cartItem
                SET Quantity = duplicate.TotalQuantity
                FROM CartItems AS cartItem
                INNER JOIN DuplicateCartItems AS duplicate ON duplicate.Id = cartItem.Id
                WHERE duplicate.RowNumber = 1;

                ;WITH DuplicateCartItems AS
                (
                    SELECT
                        Id,
                        ROW_NUMBER() OVER (PARTITION BY CartId, GiftId ORDER BY Id) AS RowNumber
                    FROM CartItems
                    WHERE GiftId IS NOT NULL
                )
                DELETE cartItem
                FROM CartItems AS cartItem
                INNER JOIN DuplicateCartItems AS duplicate ON duplicate.Id = cartItem.Id
                WHERE duplicate.RowNumber > 1;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_BouquetId",
                table: "CartItems",
                columns: new[] { "CartId", "BouquetId" },
                unique: true,
                filter: "[BouquetId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_FlowerId",
                table: "CartItems",
                columns: new[] { "CartId", "FlowerId" },
                unique: true,
                filter: "[FlowerId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_GiftId",
                table: "CartItems",
                columns: new[] { "CartId", "GiftId" },
                unique: true,
                filter: "[GiftId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_BouquetId",
                table: "CartItems");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_FlowerId",
                table: "CartItems");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_GiftId",
                table: "CartItems");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_BouquetId_FlowerId_GiftId",
                table: "CartItems",
                columns: new[] { "CartId", "BouquetId", "FlowerId", "GiftId" },
                unique: true,
                filter: "[BouquetId] IS NOT NULL AND [FlowerId] IS NOT NULL AND [GiftId] IS NOT NULL");
        }
    }
}
