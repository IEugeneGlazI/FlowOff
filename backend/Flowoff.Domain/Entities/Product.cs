using Flowoff.Domain.Common;
using Flowoff.Domain.Enums;

namespace Flowoff.Domain.Entities;

public class Product : Entity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal Price { get; private set; }
    public int StockQuantity { get; private set; }
    public ProductType Type { get; private set; }
    public bool IsShowcase { get; private set; }
    public Guid CategoryId { get; private set; }
    public Category? Category { get; private set; }

    private Product()
    {
    }

    public Product(
        string name,
        string? description,
        decimal price,
        int stockQuantity,
        ProductType type,
        Guid categoryId,
        bool isShowcase = false)
    {
        Name = name;
        Description = description;
        Price = price;
        StockQuantity = stockQuantity;
        Type = type;
        CategoryId = categoryId;
        IsShowcase = isShowcase;
    }

    public void UpdateDetails(string name, string? description, decimal price, int stockQuantity, bool isShowcase)
    {
        Name = name;
        Description = description;
        Price = price;
        StockQuantity = stockQuantity;
        IsShowcase = isShowcase;
    }

    public void DecreaseStock(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity));
        }

        if (StockQuantity < quantity)
        {
            throw new InvalidOperationException("Insufficient stock.");
        }

        StockQuantity -= quantity;
    }
}
