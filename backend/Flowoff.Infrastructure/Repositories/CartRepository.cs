using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class CartRepository : ICartRepository
{
    private readonly FlowoffDbContext _dbContext;

    public CartRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Cart> AddItemAsync(
        string customerId,
        Product product,
        int quantity,
        CancellationToken cancellationToken)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity));
        }

        var cart = await GetOrCreateAsync(customerId, cancellationToken);
        var updatedRows = await GetCartItemQuery(cart.Id, product)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(item => item.Quantity, item => item.Quantity + quantity),
                cancellationToken);

        if (updatedRows == 0)
        {
            await _dbContext.CartItems.AddAsync(new CartItem(cart.Id, product, quantity), cancellationToken);

            try
            {
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException exception) when (IsUniqueConstraintViolation(exception))
            {
                DetachAddedCartItems();

                await GetCartItemQuery(cart.Id, product)
                    .ExecuteUpdateAsync(
                        setters => setters.SetProperty(item => item.Quantity, item => item.Quantity + quantity),
                        cancellationToken);
            }
        }

        _dbContext.ChangeTracker.Clear();
        return await GetByCustomerIdAsync(customerId, cancellationToken)
            ?? throw new InvalidOperationException("Cart not found.");
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
            .FirstOrDefaultAsync(cart => cart.CustomerId == customerId, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<CartItem> GetCartItemQuery(Guid cartId, Product product)
    {
        return product switch
        {
            Bouquet bouquet => _dbContext.CartItems
                .Where(item => item.CartId == cartId && item.BouquetId == bouquet.Id),
            Flower flower => _dbContext.CartItems
                .Where(item => item.CartId == cartId && item.FlowerId == flower.Id),
            Gift gift => _dbContext.CartItems
                .Where(item => item.CartId == cartId && item.GiftId == gift.Id),
            _ => throw new InvalidOperationException("Unsupported product type.")
        };
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException exception)
    {
        return exception.InnerException is SqlException { Number: 2601 or 2627 };
    }

    private void DetachAddedCartItems()
    {
        foreach (var entry in _dbContext.ChangeTracker.Entries<CartItem>().Where(entry => entry.State == EntityState.Added))
        {
            entry.State = EntityState.Detached;
        }
    }
}
