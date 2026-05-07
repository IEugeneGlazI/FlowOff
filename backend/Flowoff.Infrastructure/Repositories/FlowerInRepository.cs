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

    public Task<FlowerIn?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.FlowerIns.FirstOrDefaultAsync(item => item.Id == id && !item.IsDeleted, cancellationToken);
    }

    public async Task AddAsync(FlowerIn flowerIn, CancellationToken cancellationToken)
    {
        await _dbContext.FlowerIns.AddAsync(flowerIn, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
