using System.ComponentModel.DataAnnotations;
using Flowoff.Domain.Enums;

namespace Flowoff.Application.DTOs.Orders;

public sealed class CreateOrderItemRequestDto
{
    [Required]
    public Guid ProductId { get; init; }

    [Range(1, 1000)]
    public int Quantity { get; init; }
}

public sealed class CreateOrderRequestDto
{
    [Required]
    public DeliveryMethod DeliveryMethod { get; init; }

    [MaxLength(500)]
    public string? DeliveryAddress { get; init; }

    public bool PayOnPickup { get; init; }

    [MinLength(1)]
    public IReadOnlyCollection<CreateOrderItemRequestDto> Items { get; init; } = [];
}

public sealed class OrderItemDto
{
    public Guid ProductId { get; init; }
    public string ProductType { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public decimal UnitPrice { get; init; }
    public int Quantity { get; init; }
}

public sealed class OrderDto
{
    public Guid Id { get; init; }
    public string Status { get; init; } = string.Empty;
    public string DeliveryMethod { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public DateTimeOffset CreatedAtUtc { get; init; }
    public string? DeliveryAddress { get; init; }
    public string? CourierId { get; init; }
    public string? PaymentStatus { get; init; }
    public IReadOnlyCollection<OrderItemDto> Items { get; init; } = [];
}

public sealed class UpdateAssemblyStatusRequestDto
{
    [Required]
    public string Status { get; init; } = string.Empty;
}

public sealed class AssignCourierRequestDto
{
    [Required]
    [EmailAddress]
    public string CourierEmail { get; init; } = string.Empty;
}

public sealed class UpdateDeliveryStatusRequestDto
{
    [Required]
    public string Status { get; init; } = string.Empty;
}
