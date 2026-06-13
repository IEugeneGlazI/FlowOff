using Flowoff.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Tests.TestHelpers;

internal sealed class SqliteFlowoffDbContextFactory : IDisposable
{
    private readonly SqliteConnection _connection;

    public SqliteFlowoffDbContextFactory()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        using var context = CreateDbContext();
        context.Database.EnsureCreated();
    }

    public FlowoffDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<FlowoffDbContext>()
            .UseSqlite(_connection)
            .EnableSensitiveDataLogging()
            .Options;

        return new FlowoffDbContext(options);
    }

    public void Dispose()
    {
        _connection.Dispose();
    }
}
