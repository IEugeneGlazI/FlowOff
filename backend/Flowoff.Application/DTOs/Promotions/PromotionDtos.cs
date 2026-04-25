using System.ComponentModel.DataAnnotations;

namespace Flowoff.Application.DTOs.Promotions;

public sealed class CreatePromotionRequestDto
{
    [Required]
    [MaxLength(150)]
    public string Title { get; init; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; init; }

    [Range(0.01, 100)]
    public decimal DiscountPercent { get; init; }

    [Required]
    public DateTime StartsAtUtc { get; init; }

    [Required]
    public DateTime EndsAtUtc { get; init; }
}

public sealed class UpdatePromotionRequestDto
{
    [Required]
    [MaxLength(150)]
    public string Title { get; init; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; init; }

    [Range(0.01, 100)]
    public decimal DiscountPercent { get; init; }

    [Required]
    public DateTime StartsAtUtc { get; init; }

    [Required]
    public DateTime EndsAtUtc { get; init; }

    public bool IsActive { get; init; }
}

public sealed class PromotionDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public decimal DiscountPercent { get; init; }
    public DateTime StartsAtUtc { get; init; }
    public DateTime EndsAtUtc { get; init; }
    public bool IsActive { get; init; }
}
