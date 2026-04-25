using System.ComponentModel.DataAnnotations;
using Flowoff.Domain.Enums;

namespace Flowoff.Application.DTOs.Products;

public sealed class ProductFilterDto
{
    public ProductType? Type { get; init; }
    public Guid? CategoryId { get; init; }
}

public sealed class ProductDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public decimal Price { get; init; }
    public int StockQuantity { get; init; }
    public string Type { get; init; } = string.Empty;
    public bool IsShowcase { get; init; }
    public Guid CategoryId { get; init; }
    public string? CategoryName { get; init; }
}

public sealed class CreateProductRequestDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; init; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; init; }

    [Range(0.01, 1000000)]
    public decimal Price { get; init; }

    [Range(0, 100000)]
    public int StockQuantity { get; init; }

    [Required]
    public ProductType Type { get; init; }

    [Required]
    public Guid CategoryId { get; init; }

    public bool IsShowcase { get; init; }
}
