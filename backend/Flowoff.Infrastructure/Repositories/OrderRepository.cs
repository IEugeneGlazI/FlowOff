using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly FlowoffDbContext _dbContext;

    public OrderRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Order order, CancellationToken cancellationToken)
    {
        await _dbContext.Orders.AddAsync(order, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.Orders
            .Include(order => order.Items)
            .Include(order => order.Delivery)
            .Include(order => order.Payment)
            .FirstOrDefaultAsync(order => order.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Order>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Orders
            .AsNoTracking()
            .Include(order => order.Items)
            .Include(order => order.Delivery)
            .Include(order => order.Payment)
            .OrderByDescending(order => order.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<Order>> GetByCustomerIdAsync(string customerId, CancellationToken cancellationToken)
    {
        return await _dbContext.Orders
            .AsNoTracking()
            .Include(order => order.Items)
            .Include(order => order.Delivery)
            .Include(order => order.Payment)
            .Where(order => order.CustomerId == customerId)
            .OrderByDescending(order => order.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
