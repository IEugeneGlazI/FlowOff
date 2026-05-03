using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface ICartRepository
{
    Task<Cart> AddItemAsync(string customerId, Product product, int quantity, CancellationToken cancellationToken);
    Task<Cart?> GetByCustomerIdAsync(string customerId, CancellationToken cancellationToken);
    Task<Cart> GetOrCreateAsync(string customerId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
