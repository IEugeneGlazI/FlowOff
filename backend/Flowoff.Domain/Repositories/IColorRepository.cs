using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface IColorRepository
{
    Task<IReadOnlyCollection<Color>> GetAllAsync(CancellationToken cancellationToken);
}
