using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class SiteContactSettingsRepository : ISiteContactSettingsRepository
{
    private readonly FlowoffDbContext _dbContext;

    public SiteContactSettingsRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<SiteContactSettings?> GetAsync(CancellationToken cancellationToken)
    {
        return _dbContext.Set<SiteContactSettings>().FirstOrDefaultAsync(cancellationToken);
    }

    public async Task AddAsync(SiteContactSettings settings, CancellationToken cancellationToken)
    {
        await _dbContext.Set<SiteContactSettings>().AddAsync(settings, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
