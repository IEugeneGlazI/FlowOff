using Flowoff.Domain.Enums;

namespace Flowoff.Domain.Entities;

public class Flower : Product
{
    public Guid FlowerInId { get; private set; }
    public FlowerIn? FlowerIn { get; private set; }
    public Guid ColorId { get; private set; }
    public Color? Color { get; private set; }

    public override ProductType Type => ProductType.Flower;

    private Flower()
    {
    }

    public Flower(
        string name,
        string? description,
        string? imageUrl,
        decimal price,
        Guid flowerInId,
        Guid colorId,
        bool isVisible = true)
        : base(name, description, imageUrl, price, isVisible)
    {
        FlowerInId = flowerInId;
        ColorId = colorId;
    }

    public void UpdateDetails(
        string name,
        string? description,
        string? imageUrl,
        decimal price,
        Guid flowerInId,
        Guid colorId)
    {
        base.UpdateDetails(name, description, imageUrl, price);
        FlowerInId = flowerInId;
        ColorId = colorId;
    }
}
