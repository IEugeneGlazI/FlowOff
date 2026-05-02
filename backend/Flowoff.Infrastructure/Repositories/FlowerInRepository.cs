using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class FlowerInRepository : IFlowerInRepository
{
    private readonly FlowoffDbContext _dbContext;

    public FlowerInRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<FlowerIn>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.FlowerIns
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.Name)
            .ToArrayAsync(cancellationToken);
    }
}
