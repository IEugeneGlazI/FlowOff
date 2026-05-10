using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface IPaymentStatusReferenceRepository
{
    Task<IReadOnlyCollection<PaymentStatusReference>> GetAllAsync(CancellationToken cancellationToken);
    Task<PaymentStatusReference?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<PaymentStatusReference?> GetByNameAsync(string name, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
