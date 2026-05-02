using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class FlowerIn : Entity
{
    public string Name { get; private set; } = string.Empty;
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAtUtc { get; private set; }

    private FlowerIn()
    {
    }

    public FlowerIn(string name)
    {
        Name = name;
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
}
