using System.ComponentModel.DataAnnotations;

namespace Flowoff.Application.DTOs.Cart;

public sealed class AddCartItemRequestDto
{
    [Required]
    public Guid ProductId { get; init; }

    [Range(1, 1000)]
    public int Quantity { get; init; }
}

public sealed class UpdateCartItemRequestDto
{
    [Required]
    public Guid ProductId { get; init; }

    [Range(0, 1000)]
    public int Quantity { get; init; }
}

public sealed class CartItemDto
{
    public Guid ProductId { get; init; }
    public string ProductType { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public decimal UnitPrice { get; init; }
    public int Quantity { get; init; }
    public decimal LineTotal { get; init; }
}

public sealed class CartDto
{
    public Guid Id { get; init; }
    public string CustomerId { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public IReadOnlyCollection<CartItemDto> Items { get; init; } = [];
}
