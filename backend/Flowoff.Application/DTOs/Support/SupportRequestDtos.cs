using System.ComponentModel.DataAnnotations;

namespace Flowoff.Application.DTOs.Support;

public sealed class CreateSupportRequestDto
{
    [Required]
    [MaxLength(200)]
    public string Subject { get; init; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Message { get; init; } = string.Empty;
}

public sealed class UpdateSupportRequestStatusDto
{
    [Required]
    public string Status { get; init; } = string.Empty;
}

public sealed class SupportRequestDto
{
    public Guid Id { get; init; }
    public string CustomerId { get; init; } = string.Empty;
    public string Subject { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAtUtc { get; init; }
}
