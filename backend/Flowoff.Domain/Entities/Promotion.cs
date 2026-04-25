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

    private Promotion()
    {
    }

    public Promotion(string title, string? description, decimal discountPercent, DateTime startsAtUtc, DateTime endsAtUtc)
    {
        Title = title;
        Description = description;
        DiscountPercent = discountPercent;
        StartsAtUtc = startsAtUtc;
        EndsAtUtc = endsAtUtc;
        IsActive = true;
    }

    public void Update(string title, string? description, decimal discountPercent, DateTime startsAtUtc, DateTime endsAtUtc, bool isActive)
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
        IsActive = isActive;
    }
}
