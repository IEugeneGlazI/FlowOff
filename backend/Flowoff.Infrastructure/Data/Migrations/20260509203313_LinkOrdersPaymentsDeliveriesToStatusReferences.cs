using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowoff.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class LinkOrdersPaymentsDeliveriesToStatusReferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PaymentStatusReferenceId",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "OrderStatusReferenceId",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "DeliveryStatusReferenceId",
                table: "Deliveries",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PaymentStatusReferenceId",
                table: "Payments",
                column: "PaymentStatusReferenceId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderStatusReferenceId",
                table: "Orders",
                column: "OrderStatusReferenceId");

            migrationBuilder.CreateIndex(
                name: "IX_Deliveries_DeliveryStatusReferenceId",
                table: "Deliveries",
                column: "DeliveryStatusReferenceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Deliveries_DeliveryStatusReferences_DeliveryStatusReferenceId",
                table: "Deliveries",
                column: "DeliveryStatusReferenceId",
                principalTable: "DeliveryStatusReferences",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_OrderStatusReferences_OrderStatusReferenceId",
                table: "Orders",
                column: "OrderStatusReferenceId",
                principalTable: "OrderStatusReferences",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_PaymentStatusReferences_PaymentStatusReferenceId",
                table: "Payments",
                column: "PaymentStatusReferenceId",
                principalTable: "PaymentStatusReferences",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Deliveries_DeliveryStatusReferences_DeliveryStatusReferenceId",
                table: "Deliveries");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_OrderStatusReferences_OrderStatusReferenceId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_PaymentStatusReferences_PaymentStatusReferenceId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_PaymentStatusReferenceId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Orders_OrderStatusReferenceId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Deliveries_DeliveryStatusReferenceId",
                table: "Deliveries");

            migrationBuilder.DropColumn(
                name: "PaymentStatusReferenceId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "OrderStatusReferenceId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DeliveryStatusReferenceId",
                table: "Deliveries");
        }
    }
}
