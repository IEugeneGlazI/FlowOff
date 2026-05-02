using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;

namespace Flowoff.Domain.Repositories;

public interface IProductRepository
{
    Task<IReadOnlyCollection<Product>> GetAllAsync(
        ProductType? type,
        Guid? categoryId,
        Guid? colorId,
        Guid? flowerInId,
        CancellationToken cancellationToken);
    Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken, bool includeHidden = false);
    Task AddAsync(Product product, CancellationToken cancellationToken);
    Task<bool> CategoryExistsAsync(Guid categoryId, CancellationToken cancellationToken);
    Task<bool> ColorExistsAsync(Guid colorId, CancellationToken cancellationToken);
    Task<bool> FlowerInExistsAsync(Guid flowerInId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
