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
}
