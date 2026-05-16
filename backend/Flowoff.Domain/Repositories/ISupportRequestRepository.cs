using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface ISupportRequestRepository
{
    Task AddAsync(SupportRequest supportRequest, CancellationToken cancellationToken);
    Task AddMessageAsync(Guid supportRequestId, SupportRequestMessage message, CancellationToken cancellationToken);
    Task<SupportRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<SupportRequest>> GetByCustomerIdAsync(string customerId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<SupportRequest>> GetAllAsync(CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
