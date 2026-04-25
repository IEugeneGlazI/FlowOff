using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface ICustomBouquetRepository
{
    Task AddAsync(CustomBouquet customBouquet, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<CustomBouquet>> GetByCustomerIdAsync(string customerId, CancellationToken cancellationToken);
}
