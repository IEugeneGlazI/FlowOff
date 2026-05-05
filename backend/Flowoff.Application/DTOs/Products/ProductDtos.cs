using System.ComponentModel.DataAnnotations;
using Flowoff.Domain.Enums;

namespace Flowoff.Application.DTOs.Products;

public sealed class ProductFilterDto
{
    public ProductType? Type { get; init; }
    public Guid? CategoryId { get; init; }
    public Guid? ColorId { get; init; }
    public Guid? FlowerInId { get; init; }
}

public sealed class ProductDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? ImageUrl { get; init; }
    public decimal Price { get; init; }
    public bool IsVisible { get; init; }
    public string Type { get; init; } = string.Empty;
    public Guid? CategoryId { get; init; }
    public string? CategoryName { get; init; }
    public Guid? FlowerInId { get; init; }
    public string? FlowerInName { get; init; }
    public Guid? ColorId { get; init; }
    public string? ColorName { get; init; }
    public IReadOnlyCollection<Guid> FlowerInIds { get; init; } = [];
    public IReadOnlyCollection<string> FlowerInNames { get; init; } = [];
    public IReadOnlyCollection<Guid> ColorIds { get; init; } = [];
    public IReadOnlyCollection<string> ColorNames { get; init; } = [];
}

public sealed class CreateProductRequestDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; init; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; init; }

    [MaxLength(2000)]
    public string? ImageUrl { get; init; }

    [Range(0.01, 1000000)]
    public decimal Price { get; init; }

    public bool IsVisible { get; init; } = true;

    [Required]
    public ProductType Type { get; init; }

    public Guid? CategoryId { get; init; }
    public Guid? FlowerInId { get; init; }
    public Guid? ColorId { get; init; }
    public IReadOnlyCollection<Guid> FlowerInIds { get; init; } = [];
    public IReadOnlyCollection<Guid> ColorIds { get; init; } = [];
}

public sealed class UpdateProductRequestDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; init; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; init; }

    [MaxLength(2000)]
    public string? ImageUrl { get; init; }

    [Range(0.01, 1000000)]
    public decimal Price { get; init; }

    public bool IsVisible { get; init; } = true;

    public Guid? CategoryId { get; init; }
    public Guid? FlowerInId { get; init; }
    public Guid? ColorId { get; init; }
    public IReadOnlyCollection<Guid> FlowerInIds { get; init; } = [];
    public IReadOnlyCollection<Guid> ColorIds { get; init; } = [];
}
