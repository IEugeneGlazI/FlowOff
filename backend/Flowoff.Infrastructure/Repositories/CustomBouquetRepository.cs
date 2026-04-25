using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class CustomBouquetRepository : ICustomBouquetRepository
{
    private readonly FlowoffDbContext _dbContext;

    public CustomBouquetRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(CustomBouquet customBouquet, CancellationToken cancellationToken)
    {
        await _dbContext.CustomBouquets.AddAsync(customBouquet, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<CustomBouquet>> GetByCustomerIdAsync(string customerId, CancellationToken cancellationToken)
    {
        return await _dbContext.CustomBouquets
            .AsNoTracking()
            .Include(bouquet => bouquet.Items)
            .ThenInclude(item => item.Product)
            .Where(bouquet => bouquet.CustomerId == customerId)
            .OrderByDescending(bouquet => bouquet.Id)
            .ToArrayAsync(cancellationToken);
    }
}
