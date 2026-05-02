using Flowoff.Domain.Enums;

namespace Flowoff.Domain.Entities;

public class Gift : Product
{
    public Guid CategoryId { get; private set; }
    public Category? Category { get; private set; }

    public override ProductType Type => ProductType.Gift;

    private Gift()
    {
    }

    public Gift(
        string name,
        string? description,
        decimal price,
        Guid categoryId,
        bool isVisible = true)
        : base(name, description, price, isVisible)
    {
        CategoryId = categoryId;
    }

    public void UpdateDetails(
        string name,
        string? description,
        decimal price,
        Guid categoryId)
    {
        base.UpdateDetails(name, description, price);
        CategoryId = categoryId;
    }
}
