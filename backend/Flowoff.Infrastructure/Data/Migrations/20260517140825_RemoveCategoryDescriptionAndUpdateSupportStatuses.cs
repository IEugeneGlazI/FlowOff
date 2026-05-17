using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowoff.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCategoryDescriptionAndUpdateSupportStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Categories");

            migrationBuilder.Sql("""
                UPDATE SupportRequests
                SET
                    Status = N'В работе',
                    SupportStatusReferenceId = (
                        SELECT TOP (1) Id
                        FROM SupportStatusReferences
                        WHERE Name = N'В работе'
                    ),
                    ClosedAtUtc = NULL
                WHERE Status = N'Ожидает ответа пользователя'
                """);

            migrationBuilder.Sql("""
                UPDATE SupportStatusReferences
                SET Name = N'Отклонено'
                WHERE Name = N'Закрыто'
                """);

            migrationBuilder.Sql("""
                UPDATE SupportRequests
                SET
                    Status = N'Отклонено',
                    SupportStatusReferenceId = (
                        SELECT TOP (1) Id
                        FROM SupportStatusReferences
                        WHERE Name = N'Отклонено'
                    ),
                    ClosedAtUtc = COALESCE(ClosedAtUtc, UpdatedAtUtc)
                WHERE Status = N'Закрыто'
                """);

            migrationBuilder.Sql("""
                DELETE FROM SupportStatusReferences
                WHERE Name = N'Ожидает ответа пользователя'
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Categories",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1
                    FROM SupportStatusReferences
                    WHERE Name = N'Ожидает ответа пользователя'
                )
                BEGIN
                    INSERT INTO SupportStatusReferences (Id, Name, IsDeleted, DeletedAtUtc)
                    VALUES (NEWID(), N'Ожидает ответа пользователя', 0, NULL)
                END
                """);

            migrationBuilder.Sql("""
                UPDATE SupportStatusReferences
                SET Name = N'Закрыто'
                WHERE Name = N'Отклонено'
                """);

            migrationBuilder.Sql("""
                UPDATE SupportRequests
                SET
                    Status = N'Закрыто',
                    SupportStatusReferenceId = (
                        SELECT TOP (1) Id
                        FROM SupportStatusReferences
                        WHERE Name = N'Закрыто'
                    )
                WHERE Status = N'Отклонено'
                """);
        }
    }
}
