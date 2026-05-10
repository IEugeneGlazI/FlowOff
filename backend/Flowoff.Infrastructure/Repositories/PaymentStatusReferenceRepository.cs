using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class PaymentStatusReferenceRepository : IPaymentStatusReferenceRepository
{
    private readonly FlowoffDbContext _dbContext;

    public PaymentStatusReferenceRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<PaymentStatusReference>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.PaymentStatusReferences
            .AsNoTracking()
            .Where(status => !status.IsDeleted)
            .OrderBy(status => status.Name)
            .ToArrayAsync(cancellationToken);
    }

    public Task<PaymentStatusReference?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.PaymentStatusReferences
            .FirstOrDefaultAsync(status => status.Id == id && !status.IsDeleted, cancellationToken);
    }

    public Task<PaymentStatusReference?> GetByNameAsync(string name, CancellationToken cancellationToken)
    {
        return _dbContext.PaymentStatusReferences
            .FirstOrDefaultAsync(status => status.Name == name && !status.IsDeleted, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
