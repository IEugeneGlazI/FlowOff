using Flowoff.Domain.Entities;

namespace Flowoff.Domain.Repositories;

public interface ISiteContactSettingsRepository
{
    Task<SiteContactSettings?> GetAsync(CancellationToken cancellationToken);
    Task AddAsync(SiteContactSettings settings, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
