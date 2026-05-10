using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowoff.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class SplitOrderStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Payments",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Orders",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Deliveries",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "PendingAssembly");

            migrationBuilder.CreateTable(
                name: "DeliveryStatusReferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryStatusReferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrderStatusReferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatusReferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PaymentStatusReferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentStatusReferences", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryStatusReferences_Code",
                table: "DeliveryStatusReferences",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusReferences_Code",
                table: "OrderStatusReferences",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentStatusReferences_Code",
                table: "PaymentStatusReferences",
                column: "Code",
                unique: true);

            migrationBuilder.Sql("""
                UPDATE d
                SET d.Status =
                    CASE
                        WHEN o.Status = 'TransferredToCourier' THEN 'AcceptedByCourier'
                        WHEN o.Status = 'InTransit' THEN 'InTransit'
                        WHEN o.Status = 'Delivered' THEN 'Delivered'
                        WHEN o.Status = 'ReceivedByCustomer' THEN 'ReceivedByCustomer'
                        WHEN o.Status = 'Cancelled' THEN 'Cancelled'
                        WHEN o.Status = 'Assembled' THEN 'AwaitingCourier'
                        ELSE 'PendingAssembly'
                    END
                FROM Deliveries d
                INNER JOIN Orders o ON o.Id = d.OrderId;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeliveryStatusReferences");

            migrationBuilder.DropTable(
                name: "OrderStatusReferences");

            migrationBuilder.DropTable(
                name: "PaymentStatusReferences");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Deliveries");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Payments",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Orders",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64);
        }
    }
}
