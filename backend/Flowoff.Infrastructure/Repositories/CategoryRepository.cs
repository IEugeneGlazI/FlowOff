using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly FlowoffDbContext _dbContext;

    public CategoryRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<Category>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Categories
            .AsNoTracking()
            .OrderBy(category => category.Name)
            .ToArrayAsync(cancellationToken);
    }

    public Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.Categories.FirstOrDefaultAsync(category => category.Id == id, cancellationToken);
    }
}
