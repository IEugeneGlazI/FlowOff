using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface IFlowerInRepository
{
    Task<IReadOnlyCollection<FlowerIn>> GetAllAsync(CancellationToken cancellationToken);
}
