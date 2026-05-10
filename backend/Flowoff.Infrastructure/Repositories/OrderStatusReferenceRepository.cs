using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class OrderStatusReferenceRepository : IOrderStatusReferenceRepository
{
    private readonly FlowoffDbContext _dbContext;

    public OrderStatusReferenceRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<OrderStatusReference>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.OrderStatusReferences
            .AsNoTracking()
            .Where(status => !status.IsDeleted)
            .OrderBy(status => status.Name)
            .ToArrayAsync(cancellationToken);
    }

    public Task<OrderStatusReference?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.OrderStatusReferences
            .FirstOrDefaultAsync(status => status.Id == id && !status.IsDeleted, cancellationToken);
    }

    public Task<OrderStatusReference?> GetByNameAsync(string name, CancellationToken cancellationToken)
    {
        return _dbContext.OrderStatusReferences
            .FirstOrDefaultAsync(status => status.Name == name && !status.IsDeleted, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
