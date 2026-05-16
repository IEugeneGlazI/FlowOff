using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface ISupportStatusReferenceRepository
{
    Task<IReadOnlyCollection<SupportStatusReference>> GetAllAsync(CancellationToken cancellationToken);
    Task<SupportStatusReference?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<SupportStatusReference?> GetByNameAsync(string name, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
