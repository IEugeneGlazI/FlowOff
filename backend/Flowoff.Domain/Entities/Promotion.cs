using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class Promotion : Entity
{
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal DiscountPercent { get; private set; }
    public DateTime StartsAtUtc { get; private set; }
    public DateTime EndsAtUtc { get; private set; }
    public bool IsActive { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAtUtc { get; private set; }
    public ICollection<PromotionBouquet> Bouquets { get; private set; } = [];
    public ICollection<PromotionFlower> Flowers { get; private set; } = [];
    public ICollection<PromotionGift> Gifts { get; private set; } = [];

    private Promotion()
    {
    }

    public Promotion(
        string title,
        string? description,
        decimal discountPercent,
        DateTime startsAtUtc,
        DateTime endsAtUtc,
        IEnumerable<Guid> bouquetIds,
        IEnumerable<Guid> flowerIds,
        IEnumerable<Guid> giftIds)
    {
        if (startsAtUtc >= endsAtUtc)
        {
            throw new InvalidOperationException("Promotion end time must be later than start time.");
        }

        Title = title;
        Description = description;
        DiscountPercent = discountPercent;
        StartsAtUtc = startsAtUtc;
        EndsAtUtc = endsAtUtc;
        IsActive = true;

        ReplaceBouquets(bouquetIds);
        ReplaceFlowers(flowerIds);
        ReplaceGifts(giftIds);
    }

    public void Update(
        string title,
        string? description,
        decimal discountPercent,
        DateTime startsAtUtc,
        DateTime endsAtUtc,
        bool isActive,
        IEnumerable<Guid> bouquetIds,
        IEnumerable<Guid> flowerIds,
        IEnumerable<Guid> giftIds)
    {
        if (IsDeleted)
        {
            throw new InvalidOperationException("Deleted promotion cannot be updated.");
        }

        if (startsAtUtc >= endsAtUtc)
        {
            throw new InvalidOperationException("Promotion end time must be later than start time.");
        }

        Title = title;
        Description = description;
        DiscountPercent = discountPercent;
        StartsAtUtc = startsAtUtc;
        EndsAtUtc = endsAtUtc;
        IsActive = isActive;

        ReplaceBouquets(bouquetIds);
        ReplaceFlowers(flowerIds);
        ReplaceGifts(giftIds);
    }

    public void SoftDelete()
    {
        if (IsDeleted)
        {
            return;
        }

        IsDeleted = true;
        IsActive = false;
        DeletedAtUtc = DateTime.UtcNow;
    }

    private void ReplaceBouquets(IEnumerable<Guid> bouquetIds)
    {
        Bouquets.Clear();
        foreach (var bouquetId in bouquetIds.Distinct())
        {
            Bouquets.Add(new PromotionBouquet(Id, bouquetId));
        }
    }

    private void ReplaceFlowers(IEnumerable<Guid> flowerIds)
    {
        Flowers.Clear();
        foreach (var flowerId in flowerIds.Distinct())
        {
            Flowers.Add(new PromotionFlower(Id, flowerId));
        }
    }

    private void ReplaceGifts(IEnumerable<Guid> giftIds)
    {
        Gifts.Clear();
        foreach (var giftId in giftIds.Distinct())
        {
            Gifts.Add(new PromotionGift(Id, giftId));
        }
    }
}
