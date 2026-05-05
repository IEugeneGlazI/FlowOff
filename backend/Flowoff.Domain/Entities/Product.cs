using Flowoff.Domain.Common;
using Flowoff.Domain.Enums;

namespace Flowoff.Domain.Entities;

public abstract class Product : Entity
{
    public string Name { get; protected set; } = string.Empty;
    public string? Description { get; protected set; }
    public string? ImageUrl { get; protected set; }
    public decimal Price { get; protected set; }
    public bool IsVisible { get; protected set; } = true;
    public bool IsDeleted { get; protected set; }
    public DateTime? DeletedAtUtc { get; protected set; }
    public abstract ProductType Type { get; }

    protected Product()
    {
    }

    protected Product(string name, string? description, string? imageUrl, decimal price, bool isVisible = true)
    {
        Name = name;
        Description = description;
        ImageUrl = imageUrl;
        Price = price;
        IsVisible = isVisible;
    }

    public virtual void UpdateDetails(string name, string? description, string? imageUrl, decimal price)
    {
        EnsureNotDeleted();

        Name = name;
        Description = description;
        ImageUrl = imageUrl;
        Price = price;
    }

    public void SoftDelete()
    {
        if (IsDeleted)
        {
            return;
        }

        IsDeleted = true;
        DeletedAtUtc = DateTime.UtcNow;
    }

    public void SetVisibility(bool isVisible)
    {
        EnsureNotDeleted();
        IsVisible = isVisible;
    }

    protected void EnsureNotDeleted()
    {
        if (IsDeleted)
        {
            throw new InvalidOperationException("Deleted product cannot be used.");
        }
    }
}
