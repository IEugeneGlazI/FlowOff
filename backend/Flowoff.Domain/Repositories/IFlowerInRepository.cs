using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface IFlowerInRepository
{
    Task<IReadOnlyCollection<FlowerIn>> GetAllAsync(CancellationToken cancellationToken);
    Task<FlowerIn?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(FlowerIn flowerIn, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
