using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class CartItem : Entity
{
    public Guid CartId { get; private set; }
    public Cart? Cart { get; private set; }
    public Guid ProductId { get; private set; }
    public Product? Product { get; private set; }
    public int Quantity { get; private set; }

    private CartItem()
    {
    }

    public CartItem(Guid cartId, Guid productId, int quantity)
    {
        CartId = cartId;
        ProductId = productId;
        Quantity = quantity;
    }

    public void IncreaseQuantity(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity));
        }

        Quantity += quantity;
    }

    public void SetQuantity(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity));
        }

        Quantity = quantity;
    }
}
