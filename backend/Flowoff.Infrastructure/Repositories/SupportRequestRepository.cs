using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class SupportRequestRepository : ISupportRequestRepository
{
    private readonly FlowoffDbContext _dbContext;

    public SupportRequestRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(SupportRequest supportRequest, CancellationToken cancellationToken)
    {
        await _dbContext.SupportRequests.AddAsync(supportRequest, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<SupportRequest>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.SupportRequests
            .AsNoTracking()
            .OrderByDescending(request => request.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public Task<SupportRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.SupportRequests.FirstOrDefaultAsync(request => request.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<SupportRequest>> GetByCustomerIdAsync(string customerId, CancellationToken cancellationToken)
    {
        return await _dbContext.SupportRequests
            .AsNoTracking()
            .Where(request => request.CustomerId == customerId)
            .OrderByDescending(request => request.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
