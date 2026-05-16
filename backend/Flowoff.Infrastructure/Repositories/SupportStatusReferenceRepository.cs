using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class SupportStatusReferenceRepository : ISupportStatusReferenceRepository
{
    private readonly FlowoffDbContext _dbContext;

    public SupportStatusReferenceRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<SupportStatusReference>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.SupportStatusReferences
            .AsNoTracking()
            .Where(status => !status.IsDeleted)
            .OrderBy(status => status.Name)
            .ToArrayAsync(cancellationToken);
    }

    public Task<SupportStatusReference?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.SupportStatusReferences
            .FirstOrDefaultAsync(status => status.Id == id && !status.IsDeleted, cancellationToken);
    }

    public Task<SupportStatusReference?> GetByNameAsync(string name, CancellationToken cancellationToken)
    {
        return _dbContext.SupportStatusReferences
            .FirstOrDefaultAsync(status => status.Name == name && !status.IsDeleted, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
