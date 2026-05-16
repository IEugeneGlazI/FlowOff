using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowoff.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSupportMessaging : Migration
    {
        private static readonly Guid SupportStatusNewId = new("4D8F59E4-7B38-4A15-8F51-79A59D92D1A1");
        private static readonly Guid SupportStatusInProgressId = new("A79437D7-0EEA-43A3-8419-4A15BFA83381");
        private static readonly Guid SupportStatusWaitingForUserId = new("4AB9D611-5FB4-4BD4-BF16-0A56818D5A9C");
        private static readonly Guid SupportStatusResolvedId = new("EFFC7B5C-06DE-4B10-B440-15F8D849A06A");
        private static readonly Guid SupportStatusClosedId = new("87E5BBD1-FB0A-4F8C-A7DA-E20EE6D1103F");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SupportStatusReferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportStatusReferences", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "SupportStatusReferences",
                columns: new[] { "Id", "Name", "IsDeleted", "DeletedAtUtc" },
                values: new object[,]
                {
                    { SupportStatusNewId, "Новое", false, null },
                    { SupportStatusInProgressId, "В работе", false, null },
                    { SupportStatusWaitingForUserId, "Ожидает ответа пользователя", false, null },
                    { SupportStatusResolvedId, "Решено", false, null },
                    { SupportStatusClosedId, "Закрыто", false, null },
                });

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "SupportRequests",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32);

            migrationBuilder.AddColumn<DateTime>(
                name: "ClosedAtUtc",
                table: "SupportRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OrderId",
                table: "SupportRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SupportStatusReferenceId",
                table: "SupportRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "SupportRequests",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.CreateTable(
                name: "SupportRequestMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SupportRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuthorUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    AuthorRole = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    MessageText = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportRequestMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupportRequestMessages_SupportRequests_SupportRequestId",
                        column: x => x.SupportRequestId,
                        principalTable: "SupportRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SupportRequestAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SupportRequestMessageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportRequestAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupportRequestAttachments_SupportRequestMessages_SupportRequestMessageId",
                        column: x => x.SupportRequestMessageId,
                        principalTable: "SupportRequestMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SupportRequests_OrderId",
                table: "SupportRequests",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportRequests_SupportStatusReferenceId",
                table: "SupportRequests",
                column: "SupportStatusReferenceId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportRequestAttachments_SupportRequestMessageId",
                table: "SupportRequestAttachments",
                column: "SupportRequestMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportRequestMessages_SupportRequestId",
                table: "SupportRequestMessages",
                column: "SupportRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportStatusReferences_Name",
                table: "SupportStatusReferences",
                column: "Name",
                unique: true);

            migrationBuilder.Sql($"""
                UPDATE SupportRequests
                SET
                    Status = CASE
                        WHEN Status = 'Open' THEN N'Новое'
                        WHEN Status = 'InProgress' THEN N'В работе'
                        WHEN Status = 'Resolved' THEN N'Решено'
                        WHEN Status = 'Closed' THEN N'Закрыто'
                        ELSE Status
                    END,
                    SupportStatusReferenceId = CASE
                        WHEN Status = 'Open' THEN '{SupportStatusNewId}'
                        WHEN Status = 'InProgress' THEN '{SupportStatusInProgressId}'
                        WHEN Status = 'Resolved' THEN '{SupportStatusResolvedId}'
                        WHEN Status = 'Closed' THEN '{SupportStatusClosedId}'
                        ELSE '{SupportStatusNewId}'
                    END,
                    UpdatedAtUtc = CreatedAtUtc,
                    ClosedAtUtc = CASE
                        WHEN Status IN ('Resolved', 'Closed') THEN CreatedAtUtc
                        ELSE NULL
                    END
                """);

            migrationBuilder.Sql("""
                INSERT INTO SupportRequestMessages (Id, SupportRequestId, AuthorUserId, AuthorRole, MessageText, CreatedAtUtc)
                SELECT NEWID(), Id, CustomerId, 'Customer', Message, CreatedAtUtc
                FROM SupportRequests
                WHERE Message IS NOT NULL AND LTRIM(RTRIM(Message)) <> ''
                """);

            migrationBuilder.DropColumn(
                name: "Message",
                table: "SupportRequests");

            migrationBuilder.AlterColumn<Guid>(
                name: "SupportStatusReferenceId",
                table: "SupportRequests",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_SupportRequests_Orders_OrderId",
                table: "SupportRequests",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_SupportRequests_SupportStatusReferences_SupportStatusReferenceId",
                table: "SupportRequests",
                column: "SupportStatusReferenceId",
                principalTable: "SupportStatusReferences",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SupportRequests_Orders_OrderId",
                table: "SupportRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_SupportRequests_SupportStatusReferences_SupportStatusReferenceId",
                table: "SupportRequests");

            migrationBuilder.DropTable(
                name: "SupportRequestAttachments");

            migrationBuilder.DropTable(
                name: "SupportStatusReferences");

            migrationBuilder.DropTable(
                name: "SupportRequestMessages");

            migrationBuilder.DropIndex(
                name: "IX_SupportRequests_OrderId",
                table: "SupportRequests");

            migrationBuilder.DropIndex(
                name: "IX_SupportRequests_SupportStatusReferenceId",
                table: "SupportRequests");

            migrationBuilder.DropColumn(
                name: "ClosedAtUtc",
                table: "SupportRequests");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "SupportRequests");

            migrationBuilder.DropColumn(
                name: "SupportStatusReferenceId",
                table: "SupportRequests");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "SupportRequests");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "SupportRequests",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64);

            migrationBuilder.AddColumn<string>(
                name: "Message",
                table: "SupportRequests",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");
        }
    }
}
