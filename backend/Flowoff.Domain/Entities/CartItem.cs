using Flowoff.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace Flowoff.Domain.Entities;

public class CartItem : Entity
{
    public Guid CartId { get; private set; }
    public Cart? Cart { get; private set; }
    public Guid? BouquetId { get; private set; }
    public Bouquet? Bouquet { get; private set; }
    public Guid? FlowerId { get; private set; }
    public Flower? Flower { get; private set; }
    public Guid? GiftId { get; private set; }
    public Gift? Gift { get; private set; }
    public int Quantity { get; private set; }

    [NotMapped]
    public Guid ProductId => BouquetId ?? FlowerId ?? GiftId ?? Guid.Empty;

    private CartItem()
    {
    }

    public CartItem(Guid cartId, Product product, int quantity)
    {
        CartId = cartId;
        SetProductReference(product);
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

    public bool MatchesProductId(Guid productId)
    {
        return ProductId == productId;
    }

    private void SetProductReference(Product product)
    {
        BouquetId = null;
        FlowerId = null;
        GiftId = null;

        switch (product)
        {
            case Bouquet bouquet:
                BouquetId = bouquet.Id;
                break;
            case Flower flower:
                FlowerId = flower.Id;
                break;
            case Gift gift:
                GiftId = gift.Id;
                break;
            default:
                throw new InvalidOperationException("Unsupported product type.");
        }
    }
}
