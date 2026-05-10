using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface IOrderStatusReferenceRepository
{
    Task<IReadOnlyCollection<OrderStatusReference>> GetAllAsync(CancellationToken cancellationToken);
    Task<OrderStatusReference?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<OrderStatusReference?> GetByNameAsync(string name, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
