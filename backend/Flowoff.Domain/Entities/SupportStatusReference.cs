using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class SupportStatusReference : Entity
{
    public string Name { get; private set; } = string.Empty;
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAtUtc { get; private set; }

    private SupportStatusReference()
    {
    }

    public SupportStatusReference(string name)
    {
        Name = name;
    }

    public void Update(string name)
    {
        Name = name;
    }

    public void Restore(string name)
    {
        Name = name;
        IsDeleted = false;
        DeletedAtUtc = null;
    }
}
