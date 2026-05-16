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

    public async Task AddMessageAsync(Guid supportRequestId, SupportRequestMessage message, CancellationToken cancellationToken)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        message.AttachToRequest(supportRequestId);
        await _dbContext.SupportRequestMessages.AddAsync(message, cancellationToken);

        var updatedRows = await _dbContext.SupportRequests
            .Where(request => request.Id == supportRequestId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(request => request.UpdatedAtUtc, DateTime.UtcNow), cancellationToken);

        if (updatedRows == 0)
        {
            throw new InvalidOperationException("Support request not found.");
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<SupportRequest>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await BuildQuery(asNoTracking: true)
            .OrderByDescending(request => request.UpdatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public Task<SupportRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return BuildQuery(asNoTracking: false)
            .FirstOrDefaultAsync(request => request.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<SupportRequest>> GetByCustomerIdAsync(string customerId, CancellationToken cancellationToken)
    {
        return await BuildQuery(asNoTracking: true)
            .Where(request => request.CustomerId == customerId)
            .OrderByDescending(request => request.UpdatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<SupportRequest> BuildQuery(bool asNoTracking)
    {
        var query = _dbContext.SupportRequests
            .Include(request => request.Order)
            .Include(request => request.SupportStatusReference)
            .Include(request => request.Messages)
                .ThenInclude(message => message.Attachments)
            .AsQueryable();

        return asNoTracking ? query.AsNoTracking() : query;
    }
}
