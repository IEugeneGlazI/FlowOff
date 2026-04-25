using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;

namespace Flowoff.Domain.Repositories;

public interface IProductRepository
{
    Task<IReadOnlyCollection<Product>> GetAllAsync(ProductType? type, Guid? categoryId, CancellationToken cancellationToken);
    Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(Product product, CancellationToken cancellationToken);
}
