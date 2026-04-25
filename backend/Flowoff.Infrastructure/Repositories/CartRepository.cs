using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class CartRepository : ICartRepository
{
    private readonly FlowoffDbContext _dbContext;

    public CartRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Cart> GetOrCreateAsync(string customerId, CancellationToken cancellationToken)
    {
        var cart = await GetByCustomerIdAsync(customerId, cancellationToken);
        if (cart is not null)
        {
            return cart;
        }

        cart = new Cart(customerId);
        await _dbContext.Carts.AddAsync(cart, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return cart;
    }

    public Task<Cart?> GetByCustomerIdAsync(string customerId, CancellationToken cancellationToken)
    {
        return _dbContext.Carts
            .Include(cart => cart.Items)
            .ThenInclude(item => item.Product)
            .FirstOrDefaultAsync(cart => cart.CustomerId == customerId, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
