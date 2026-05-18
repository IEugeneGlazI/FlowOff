using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class ColorRepository : IColorRepository
{
    private readonly FlowoffDbContext _dbContext;

    public ColorRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<Color>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Colors
            .AsNoTracking()
            .Where(color => !color.IsDeleted)
            .OrderBy(color => color.Name)
            .ToArrayAsync(cancellationToken);
    }

    public Task<Color?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.Colors.FirstOrDefaultAsync(color => color.Id == id && !color.IsDeleted, cancellationToken);
    }

    public async Task<bool> IsInUseAsync(Guid id, CancellationToken cancellationToken)
    {
        if (await _dbContext.Flowers.AnyAsync(flower => !flower.IsDeleted && flower.ColorId == id, cancellationToken))
        {
            return true;
        }

        return await _dbContext.Set<BouquetColor>()
            .AnyAsync(item => item.ColorId == id && !item.Bouquet!.IsDeleted, cancellationToken);
    }

    public async Task AddAsync(Color color, CancellationToken cancellationToken)
    {
        await _dbContext.Colors.AddAsync(color, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
