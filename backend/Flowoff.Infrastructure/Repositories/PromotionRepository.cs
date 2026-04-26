using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class PromotionRepository : IPromotionRepository
{
    private readonly FlowoffDbContext _dbContext;

    public PromotionRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Promotion promotion, CancellationToken cancellationToken)
    {
        await _dbContext.Promotions.AddAsync(promotion, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<Promotion>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Promotions
            .AsNoTracking()
            .Where(promotion => !promotion.IsDeleted)
            .OrderByDescending(promotion => promotion.StartsAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public Task<Promotion?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.Promotions.FirstOrDefaultAsync(promotion => promotion.Id == id && !promotion.IsDeleted, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
