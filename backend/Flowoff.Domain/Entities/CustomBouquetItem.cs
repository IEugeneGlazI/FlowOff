using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class CustomBouquetItem : Entity
{
    public Guid CustomBouquetId { get; private set; }
    public CustomBouquet? CustomBouquet { get; private set; }
    public Guid ProductId { get; private set; }
    public Product? Product { get; private set; }
    public int Quantity { get; private set; }

    private CustomBouquetItem()
    {
    }

    public CustomBouquetItem(Guid productId, int quantity)
    {
        ProductId = productId;
        Quantity = quantity;
    }
}
