using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class Cart : Entity
{
    public string CustomerId { get; private set; } = string.Empty;
    public ICollection<CartItem> Items { get; private set; } = [];

    private Cart()
    {
    }

    public Cart(string customerId)
    {
        CustomerId = customerId;
    }

    public void AddItem(Product product, int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity));
        }

        var existingItem = Items.FirstOrDefault(item => item.MatchesProductId(product.Id));
        if (existingItem is not null)
        {
            existingItem.IncreaseQuantity(quantity);
            return;
        }

        Items.Add(new CartItem(Id, product, quantity));
    }

    public void UpdateItemQuantity(Guid productId, int quantity)
    {
        var item = Items.FirstOrDefault(cartItem => cartItem.MatchesProductId(productId));
        if (item is null)
        {
            throw new InvalidOperationException("Cart item not found.");
        }

        if (quantity <= 0)
        {
            Items.Remove(item);
            return;
        }

        item.SetQuantity(quantity);
    }

    public void RemoveItem(Guid productId)
    {
        var item = Items.FirstOrDefault(cartItem => cartItem.MatchesProductId(productId));
        if (item is null)
        {
            return;
        }

        Items.Remove(item);
    }

    public void Clear()
    {
        Items.Clear();
    }
}
