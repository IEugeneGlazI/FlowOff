using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class DeliveryStatusReferenceRepository : IDeliveryStatusReferenceRepository
{
    private readonly FlowoffDbContext _dbContext;

    public DeliveryStatusReferenceRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<DeliveryStatusReference>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.DeliveryStatusReferences
            .AsNoTracking()
            .Where(status => !status.IsDeleted)
            .OrderBy(status => status.Name)
            .ToArrayAsync(cancellationToken);
    }

    public Task<DeliveryStatusReference?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.DeliveryStatusReferences
            .FirstOrDefaultAsync(status => status.Id == id && !status.IsDeleted, cancellationToken);
    }

    public Task<DeliveryStatusReference?> GetByNameAsync(string name, CancellationToken cancellationToken)
    {
        return _dbContext.DeliveryStatusReferences
            .FirstOrDefaultAsync(status => status.Name == name && !status.IsDeleted, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
