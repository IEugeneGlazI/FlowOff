using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class OrderStatusReference : Entity
{
    public string Name { get; private set; } = string.Empty;
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAtUtc { get; private set; }

    private OrderStatusReference()
    {
    }

    public OrderStatusReference(string name)
    {
        Name = name;
    }

    public void Update(string name)
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

    public void Restore(string name)
    {
        Name = name;
        IsDeleted = false;
        DeletedAtUtc = null;
    }
}
