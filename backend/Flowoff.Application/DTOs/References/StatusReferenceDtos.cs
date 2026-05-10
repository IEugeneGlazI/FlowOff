namespace Flowoff.Application.DTOs.References;

public sealed class StatusReferenceItemDto
{
    public Guid Id { get; init; }
    public string Group { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}
