using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface IDeliveryStatusReferenceRepository
{
    Task<IReadOnlyCollection<DeliveryStatusReference>> GetAllAsync(CancellationToken cancellationToken);
    Task<DeliveryStatusReference?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<DeliveryStatusReference?> GetByNameAsync(string name, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
