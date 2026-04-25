using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface IOrderRepository
{
    Task AddAsync(Order order, CancellationToken cancellationToken);
    Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Order>> GetByCustomerIdAsync(string customerId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Order>> GetAllAsync(CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
