using Flowoff.Application.DTOs.Orders;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class OrderService : IOrderService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;

    public OrderService(
        IOrderRepository orderRepository,
        IProductRepository productRepository,
        ICurrentUserService currentUserService)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
        _currentUserService = currentUserService;
    }

    public async Task<OrderDto> CreateAsync(CreateOrderRequestDto request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            throw new InvalidOperationException("Authenticated user is required.");
        }

        if (request.DeliveryMethod == DeliveryMethod.Delivery && string.IsNullOrWhiteSpace(request.DeliveryAddress))
        {
            throw new InvalidOperationException("Delivery address is required.");
        }

        if (request.DeliveryMethod == DeliveryMethod.Delivery && request.PayOnPickup)
        {
            throw new InvalidOperationException("Delivery orders require online payment.");
        }

        var orderItems = new List<OrderItem>();

        foreach (var item in request.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken);
            if (product is null)
            {
                throw new InvalidOperationException($"Product {item.ProductId} not found.");
            }

            product.DecreaseStock(item.Quantity);
            orderItems.Add(new OrderItem(product.Id, product.Name, product.Price, item.Quantity));
        }

        var totalAmount = orderItems.Sum(item => item.UnitPrice * item.Quantity);
        var order = new Order(_currentUserService.UserId, request.DeliveryMethod, orderItems, totalAmount);

        if (request.DeliveryMethod == DeliveryMethod.Delivery)
        {
            order.AttachDelivery(new Delivery(order.Id, request.DeliveryAddress));
        }

        if (request.PayOnPickup && request.DeliveryMethod == DeliveryMethod.Pickup)
        {
            order.AllowPickupPayment();
            order.AttachPayment(new Payment(order.Id, totalAmount, "CashOnPickup", PaymentStatus.Pending));
        }
        else
        {
            order.MarkPaid();
            order.AttachPayment(new Payment(order.Id, totalAmount, "StubOnlinePayment", PaymentStatus.Paid));
        }

        await _orderRepository.AddAsync(order, cancellationToken);
        return Map(order);
    }

    public async Task<IReadOnlyCollection<OrderDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var orders = await _orderRepository.GetAllAsync(cancellationToken);
        return orders.Select(Map).ToArray();
    }

    public async Task<OrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(id, cancellationToken);
        return order is null ? null : Map(order);
    }

    public async Task<IReadOnlyCollection<OrderDto>> GetMyOrdersAsync(CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            return [];
        }

        var orders = await _orderRepository.GetByCustomerIdAsync(_currentUserService.UserId, cancellationToken);
        return orders.Select(Map).ToArray();
    }

    public async Task<OrderDto> UpdateAssemblyStatusAsync(Guid id, UpdateAssemblyStatusRequestDto request, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Order not found.");

        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var status))
        {
            throw new InvalidOperationException("Invalid order status.");
        }

        var allowedAssemblyStatuses = new[]
        {
            OrderStatus.Accepted,
            OrderStatus.InAssembly,
            OrderStatus.Assembled,
            OrderStatus.TransferredToCourier
        };

        if (!allowedAssemblyStatuses.Contains(status))
        {
            throw new InvalidOperationException("Only florist assembly statuses are allowed.");
        }

        order.SetAssemblyStatus(status);
        await _orderRepository.SaveChangesAsync(cancellationToken);
        return Map(order);
    }

    private static OrderDto Map(Order order) =>
        new()
        {
            Id = order.Id,
            Status = order.Status.ToString(),
            DeliveryMethod = order.DeliveryMethod.ToString(),
            TotalAmount = order.TotalAmount,
            CreatedAtUtc = order.CreatedAtUtc,
            DeliveryAddress = order.Delivery?.Address,
            PaymentStatus = order.Payment?.Status.ToString(),
            Items = order.Items.Select(item => new OrderItemDto
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity
            }).ToArray()
        };
}
