using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class Category : Entity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    private Category()
    {
    }

    public Category(string name, string? description = null)
    {
        Name = name;
        Description = description;
    }
}
