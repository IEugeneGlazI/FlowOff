using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;
using Flowoff.Domain.Statuses;
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

    public async Task<int> GetNextOrderNumberAsync(CancellationToken cancellationToken)
    {
        var maxOrderNumber = await _dbContext.Orders
            .Select(order => (int?)order.OrderNumber)
            .MaxAsync(cancellationToken);

        return (maxOrderNumber ?? 0) + 1;
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
        return await Query()
            .AsNoTracking()
            .OrderByDescending(order => order.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public IQueryable<Order> Query()
    {
        return _dbContext.Orders
            .Include(order => order.Items)
            .Include(order => order.Delivery)
            .Include(order => order.Payment);
    }

    public async Task<IReadOnlyCollection<Order>> GetAvailableForCourierAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Orders
            .AsNoTracking()
            .Include(order => order.Items)
            .Include(order => order.Delivery)
            .Include(order => order.Payment)
            .Where(order =>
                order.DeliveryMethod == DeliveryMethod.Delivery
                && order.Status == OrderStatusCodes.Active
                && order.Delivery != null
                && order.Delivery.Status == DeliveryStatusCodes.ReadyForPickup
                && order.Delivery.CourierId == null)
            .OrderByDescending(order => order.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<Order>> GetByCourierIdAsync(string courierId, CancellationToken cancellationToken)
    {
        return await _dbContext.Orders
            .AsNoTracking()
            .Include(order => order.Items)
            .Include(order => order.Delivery)
            .Include(order => order.Payment)
            .Where(order => order.Delivery != null && order.Delivery.CourierId == courierId)
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
