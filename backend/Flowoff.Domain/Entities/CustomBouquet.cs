using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class CustomBouquet : Entity
{
    public string CustomerId { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public decimal TotalPrice { get; private set; }
    public ICollection<CustomBouquetItem> Items { get; private set; } = [];

    private CustomBouquet()
    {
    }

    public CustomBouquet(string customerId, string name, decimal totalPrice, IEnumerable<CustomBouquetItem> items)
    {
        CustomerId = customerId;
        Name = name;
        TotalPrice = totalPrice;
        Items = items.ToList();
    }
}
