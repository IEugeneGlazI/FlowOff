using Flowoff.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace Flowoff.Domain.Entities;

public class OrderItem : Entity
{
    public Guid OrderId { get; private set; }
    public Order? Order { get; private set; }
    public Guid? BouquetId { get; private set; }
    public Bouquet? Bouquet { get; private set; }
    public Guid? FlowerId { get; private set; }
    public Flower? Flower { get; private set; }
    public Guid? GiftId { get; private set; }
    public Gift? Gift { get; private set; }
    public string ProductType { get; private set; } = string.Empty;
    public string ProductName { get; private set; } = string.Empty;
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }

    [NotMapped]
    public Guid ProductId => BouquetId ?? FlowerId ?? GiftId ?? Guid.Empty;

    private OrderItem()
    {
    }

    public OrderItem(Product product, int quantity)
    {
        SetProductReference(product);
        ProductType = product.Type.ToString();
        ProductName = product.Name;
        UnitPrice = product.Price;
        Quantity = quantity;
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
