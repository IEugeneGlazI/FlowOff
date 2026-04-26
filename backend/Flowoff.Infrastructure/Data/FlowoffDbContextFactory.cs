using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Flowoff.Infrastructure.Data;

public class FlowoffDbContextFactory : IDesignTimeDbContextFactory<FlowoffDbContext>
{
    public FlowoffDbContext CreateDbContext(string[] args)
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var currentDirectory = Directory.GetCurrentDirectory();
        var startupProjectPath = Path.Combine(currentDirectory, "Flowoff.Web");

        if (!Directory.Exists(startupProjectPath))
        {
            startupProjectPath = currentDirectory;
        }

        var configuration = new ConfigurationBuilder()
            .SetBasePath(startupProjectPath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

        var optionsBuilder = new DbContextOptionsBuilder<FlowoffDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new FlowoffDbContext(optionsBuilder.Options);
    }
}
