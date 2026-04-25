using System.ComponentModel.DataAnnotations;

namespace Flowoff.Application.DTOs.CustomBouquets;

public sealed class CustomBouquetItemRequestDto
{
    [Required]
    public Guid ProductId { get; init; }

    [Range(1, 1000)]
    public int Quantity { get; init; }
}

public sealed class CreateCustomBouquetRequestDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; init; } = string.Empty;

    [MinLength(1)]
    public IReadOnlyCollection<CustomBouquetItemRequestDto> Items { get; init; } = [];
}

public sealed class CustomBouquetItemDto
{
    public Guid ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public decimal UnitPrice { get; init; }
    public int Quantity { get; init; }
    public decimal LineTotal { get; init; }
}

public sealed class CustomBouquetDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public decimal TotalPrice { get; init; }
    public IReadOnlyCollection<CustomBouquetItemDto> Items { get; init; } = [];
}

public sealed class CustomBouquetCalculationDto
{
    public decimal TotalPrice { get; init; }
    public IReadOnlyCollection<CustomBouquetItemDto> Items { get; init; } = [];
}
