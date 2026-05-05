using Flowoff.Domain.Enums;

namespace Flowoff.Domain.Entities;

public class Bouquet : Product
{
    public ICollection<BouquetFlowerIn> FlowerIns { get; private set; } = [];
    public ICollection<BouquetColor> Colors { get; private set; } = [];

    public override ProductType Type => ProductType.Bouquet;

    private Bouquet()
    {
    }

    public Bouquet(
        string name,
        string? description,
        string? imageUrl,
        decimal price,
        IEnumerable<Guid> flowerInIds,
        IEnumerable<Guid> colorIds,
        bool isVisible = true)
        : base(name, description, imageUrl, price, isVisible)
    {
        ReplaceFlowerIns(flowerInIds);
        ReplaceColors(colorIds);
    }

    public void UpdateDetails(
        string name,
        string? description,
        string? imageUrl,
        decimal price,
        IEnumerable<Guid> flowerInIds,
        IEnumerable<Guid> colorIds)
    {
        base.UpdateDetails(name, description, imageUrl, price);
        ReplaceFlowerIns(flowerInIds);
        ReplaceColors(colorIds);
    }

    public void ReplaceFlowerIns(IEnumerable<Guid> flowerInIds)
    {
        EnsureNotDeleted();

        FlowerIns.Clear();
        foreach (var flowerInId in flowerInIds.Distinct())
        {
            FlowerIns.Add(new BouquetFlowerIn(Id, flowerInId));
        }
    }

    public void ReplaceColors(IEnumerable<Guid> colorIds)
    {
        EnsureNotDeleted();

        Colors.Clear();
        foreach (var colorId in colorIds.Distinct())
        {
            Colors.Add(new BouquetColor(Id, colorId));
        }
    }
}
