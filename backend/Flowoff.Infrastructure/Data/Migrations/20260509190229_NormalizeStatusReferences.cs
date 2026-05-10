using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowoff.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeStatusReferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PaymentStatusReferences_Code",
                table: "PaymentStatusReferences");

            migrationBuilder.DropIndex(
                name: "IX_OrderStatusReferences_Code",
                table: "OrderStatusReferences");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryStatusReferences_Code",
                table: "DeliveryStatusReferences");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "PaymentStatusReferences");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "PaymentStatusReferences");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "PaymentStatusReferences");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "OrderStatusReferences");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "OrderStatusReferences");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "OrderStatusReferences");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "DeliveryStatusReferences");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "DeliveryStatusReferences");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "DeliveryStatusReferences");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentStatusReferences_Name",
                table: "PaymentStatusReferences",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusReferences_Name",
                table: "OrderStatusReferences",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryStatusReferences_Name",
                table: "DeliveryStatusReferences",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PaymentStatusReferences_Name",
                table: "PaymentStatusReferences");

            migrationBuilder.DropIndex(
                name: "IX_OrderStatusReferences_Name",
                table: "OrderStatusReferences");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryStatusReferences_Name",
                table: "DeliveryStatusReferences");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "PaymentStatusReferences",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "PaymentStatusReferences",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "PaymentStatusReferences",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "OrderStatusReferences",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "OrderStatusReferences",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "OrderStatusReferences",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "DeliveryStatusReferences",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "DeliveryStatusReferences",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "DeliveryStatusReferences",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentStatusReferences_Code",
                table: "PaymentStatusReferences",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusReferences_Code",
                table: "OrderStatusReferences",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryStatusReferences_Code",
                table: "DeliveryStatusReferences",
                column: "Code",
                unique: true);
        }
    }
}
