using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowoff.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_SupportRequests_CustomerId",
                table: "SupportRequests",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportRequestMessages_AuthorUserId",
                table: "SupportRequestMessages",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CustomerId",
                table: "Orders",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_FloristId",
                table: "Orders",
                column: "FloristId");

            migrationBuilder.CreateIndex(
                name: "IX_Deliveries_CourierId",
                table: "Deliveries",
                column: "CourierId");

            migrationBuilder.AddForeignKey(
                name: "FK_Carts_AspNetUsers_CustomerId",
                table: "Carts",
                column: "CustomerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Deliveries_AspNetUsers_CourierId",
                table: "Deliveries",
                column: "CourierId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_AspNetUsers_CustomerId",
                table: "Orders",
                column: "CustomerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_AspNetUsers_FloristId",
                table: "Orders",
                column: "FloristId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SupportRequestMessages_AspNetUsers_AuthorUserId",
                table: "SupportRequestMessages",
                column: "AuthorUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SupportRequests_AspNetUsers_CustomerId",
                table: "SupportRequests",
                column: "CustomerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Carts_AspNetUsers_CustomerId",
                table: "Carts");

            migrationBuilder.DropForeignKey(
                name: "FK_Deliveries_AspNetUsers_CourierId",
                table: "Deliveries");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_AspNetUsers_CustomerId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_AspNetUsers_FloristId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_SupportRequestMessages_AspNetUsers_AuthorUserId",
                table: "SupportRequestMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_SupportRequests_AspNetUsers_CustomerId",
                table: "SupportRequests");

            migrationBuilder.DropIndex(
                name: "IX_SupportRequests_CustomerId",
                table: "SupportRequests");

            migrationBuilder.DropIndex(
                name: "IX_SupportRequestMessages_AuthorUserId",
                table: "SupportRequestMessages");

            migrationBuilder.DropIndex(
                name: "IX_Orders_CustomerId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_FloristId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Deliveries_CourierId",
                table: "Deliveries");
        }
    }
}
