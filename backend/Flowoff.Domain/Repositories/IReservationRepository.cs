using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface IReservationRepository
{
    Task AddAsync(Reservation reservation, CancellationToken cancellationToken);
    Task<Reservation?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Reservation>> GetByCustomerIdAsync(string customerId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Reservation>> GetActiveByProductIdAsync(Guid productId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Reservation>> GetActiveAsync(CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
