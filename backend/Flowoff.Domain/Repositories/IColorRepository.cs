using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface IColorRepository
{
    Task<IReadOnlyCollection<Color>> GetAllAsync(CancellationToken cancellationToken);
    Task<Color?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(Color color, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
