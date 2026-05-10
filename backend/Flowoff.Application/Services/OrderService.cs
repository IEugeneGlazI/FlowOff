using Flowoff.Application.DTOs.Orders;
using Flowoff.Application.DTOs.Users;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Common;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;
using Flowoff.Domain.Statuses;

namespace Flowoff.Application.Services;

public class OrderService : IOrderService
{
    private readonly ICourierDirectoryService _courierDirectoryService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDeliveryStatusReferenceRepository _deliveryStatusReferenceRepository;
    private readonly IOrderNotificationService _orderNotificationService;
    private readonly IOrderRepository _orderRepository;
    private readonly IOrderStatusReferenceRepository _orderStatusReferenceRepository;
    private readonly IPaymentStatusReferenceRepository _paymentStatusReferenceRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUserDirectoryService _userDirectoryService;

    public OrderService(
        IOrderRepository orderRepository,
        IProductRepository productRepository,
        ICurrentUserService currentUserService,
        ICourierDirectoryService courierDirectoryService,
        IOrderNotificationService orderNotificationService,
        IUserDirectoryService userDirectoryService,
        IOrderStatusReferenceRepository orderStatusReferenceRepository,
        IDeliveryStatusReferenceRepository deliveryStatusReferenceRepository,
        IPaymentStatusReferenceRepository paymentStatusReferenceRepository)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
        _currentUserService = currentUserService;
        _courierDirectoryService = courierDirectoryService;
        _orderNotificationService = orderNotificationService;
        _userDirectoryService = userDirectoryService;
        _orderStatusReferenceRepository = orderStatusReferenceRepository;
        _deliveryStatusReferenceRepository = deliveryStatusReferenceRepository;
        _paymentStatusReferenceRepository = paymentStatusReferenceRepository;
    }

    public async Task<OrderDto> AssignCourierAsync(Guid id, AssignCourierRequestDto request, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Order not found.");

        var courier = await _courierDirectoryService.GetCourierByEmailAsync(request.CourierEmail, cancellationToken)
            ?? throw new InvalidOperationException("Courier not found.");

        var activeOrderStatusId = await GetOrderStatusIdAsync(OrderStatusCodes.Active, cancellationToken);
        var transferringToDeliveryStatusId = await GetDeliveryStatusIdAsync(DeliveryStatusCodes.TransferringToDelivery, cancellationToken);

        order.AssignCourier(courier.Id, activeOrderStatusId, transferringToDeliveryStatusId);
        await _orderRepository.SaveChangesAsync(cancellationToken);
        await _orderNotificationService.NotifyTransferredToDeliveryAsync(order, cancellationToken);
        return await MapOrderAsync(order, cancellationToken);
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
            var product = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken, asTracking: false);
            if (product is null)
            {
                throw new InvalidOperationException($"Product {item.ProductId} not found.");
            }

            orderItems.Add(new OrderItem(product, item.Quantity));
        }

        var totalAmount = orderItems.Sum(item => item.UnitPrice * item.Quantity);
        var orderNumber = await _orderRepository.GetNextOrderNumberAsync(cancellationToken);
        var activeOrderStatusId = await GetOrderStatusIdAsync(OrderStatusCodes.Active, cancellationToken);
        var underReviewDeliveryStatusId = await GetDeliveryStatusIdAsync(DeliveryStatusCodes.UnderReview, cancellationToken);
        var pendingPaymentStatusId = await GetPaymentStatusIdAsync(PaymentStatusCodes.Pending, cancellationToken);
        var paidPaymentStatusId = await GetPaymentStatusIdAsync(PaymentStatusCodes.Paid, cancellationToken);
        var order = new Order(orderNumber, _currentUserService.UserId, request.DeliveryMethod, orderItems, totalAmount, activeOrderStatusId);

        order.AttachDelivery(new Delivery(order.Id, request.DeliveryMethod == DeliveryMethod.Delivery ? request.DeliveryAddress : null, underReviewDeliveryStatusId));

        if (request.PayOnPickup && request.DeliveryMethod == DeliveryMethod.Pickup)
        {
            order.AllowPickupPayment();
            order.AttachPayment(new Payment(order.Id, totalAmount, "CashOnPickup", PaymentStatusCodes.Pending, pendingPaymentStatusId));
        }
        else
        {
            order.MarkPaid(activeOrderStatusId);
            order.AttachPayment(new Payment(order.Id, totalAmount, "StubOnlinePayment", PaymentStatusCodes.Paid, paidPaymentStatusId));
        }

        await _orderRepository.AddAsync(order, cancellationToken);
        return await MapOrderAsync(order, cancellationToken);
    }

    public async Task<IReadOnlyCollection<OrderDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var orders = await _orderRepository.GetAllAsync(cancellationToken);
        return await MapOrdersAsync(orders, cancellationToken);
    }

    public async Task<OrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(id, cancellationToken);
        return order is null ? null : await MapOrderAsync(order, cancellationToken);
    }

    public async Task<IReadOnlyCollection<OrderDto>> GetMyOrdersAsync(CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            return [];
        }

        var orders = await _orderRepository.GetByCustomerIdAsync(_currentUserService.UserId, cancellationToken);
        return await MapOrdersAsync(orders, cancellationToken);
    }

    public async Task<IReadOnlyCollection<OrderDto>> GetAssignedToCourierAsync(CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            return [];
        }

        var orders = await _orderRepository.GetByCourierIdAsync(_currentUserService.UserId, cancellationToken);
        return await MapOrdersAsync(orders, cancellationToken);
    }

    public async Task<IReadOnlyCollection<OrderDto>> GetAvailableForCourierAsync(CancellationToken cancellationToken)
    {
        var orders = await _orderRepository.GetAvailableForCourierAsync(cancellationToken);
        return await MapOrdersAsync(orders, cancellationToken);
    }

    public async Task<OrderDto> AcceptForDeliveryAsync(Guid id, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            throw new InvalidOperationException("Authenticated courier is required.");
        }

        var order = await _orderRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Order not found.");

        var activeOrderStatusId = await GetOrderStatusIdAsync(OrderStatusCodes.Active, cancellationToken);
        var acceptedByCourierStatusId = await GetDeliveryStatusIdAsync(DeliveryStatusCodes.AcceptedByCourier, cancellationToken);

        order.AcceptByCourier(_currentUserService.UserId, activeOrderStatusId, acceptedByCourierStatusId);
        await _orderRepository.SaveChangesAsync(cancellationToken);
        await _orderNotificationService.NotifyTransferredToDeliveryAsync(order, cancellationToken);
        return await MapOrderAsync(order, cancellationToken);
    }

    public async Task<OrderDto> UpdateAssemblyStatusAsync(Guid id, UpdateAssemblyStatusRequestDto request, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Order not found.");

        var status = request.Status.Trim();

        if (!DeliveryStatusCodes.All.Contains(status, StringComparer.Ordinal))
        {
            throw new InvalidOperationException("Invalid delivery status.");
        }

        var allowedAssemblyStatuses = new[]
        {
            DeliveryStatusCodes.InAssembly,
            DeliveryStatusCodes.ReadyForPickup
        };

        if (!allowedAssemblyStatuses.Contains(status))
        {
            throw new InvalidOperationException("Only florist assembly statuses are allowed.");
        }

        if (_currentUserService.Role == nameof(UserRole.Florist) && string.IsNullOrWhiteSpace(order.FloristId) && !string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            order.AssignFlorist(_currentUserService.UserId);
        }

        var activeOrderStatusId = await GetOrderStatusIdAsync(OrderStatusCodes.Active, cancellationToken);
        var deliveryStatusId = await GetDeliveryStatusIdAsync(status, cancellationToken);

        order.SetAssemblyStatus(status, activeOrderStatusId, deliveryStatusId);
        await _orderRepository.SaveChangesAsync(cancellationToken);

        if (status == DeliveryStatusCodes.ReadyForPickup && order.DeliveryMethod == DeliveryMethod.Pickup)
        {
            await _orderNotificationService.NotifyPickupReadyAsync(order, cancellationToken);
        }

        return await MapOrderAsync(order, cancellationToken);
    }

    public async Task<OrderDto> CompletePickupAsync(Guid id, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Order not found.");

        var completedOrderStatusId = await GetOrderStatusIdAsync(OrderStatusCodes.Completed, cancellationToken);
        var receivedByCustomerStatusId = await GetDeliveryStatusIdAsync(DeliveryStatusCodes.ReceivedByCustomer, cancellationToken);
        var paidPaymentStatusId = await GetPaymentStatusIdAsync(PaymentStatusCodes.Paid, cancellationToken);

        order.CompletePickup(completedOrderStatusId, receivedByCustomerStatusId, paidPaymentStatusId);
        await _orderRepository.SaveChangesAsync(cancellationToken);
        return await MapOrderAsync(order, cancellationToken);
    }

    public async Task<OrderDto> UpdateDeliveryStatusAsync(Guid id, UpdateDeliveryStatusRequestDto request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            throw new InvalidOperationException("Authenticated courier is required.");
        }

        var order = await _orderRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Order not found.");

        if (order.Delivery?.CourierId != _currentUserService.UserId)
        {
            throw new InvalidOperationException("This order is not assigned to the current courier.");
        }

        var status = request.Status.Trim();

        if (!DeliveryStatusCodes.All.Contains(status, StringComparer.Ordinal))
        {
            throw new InvalidOperationException("Invalid delivery status.");
        }

        var allowedDeliveryStatuses = new[]
        {
            DeliveryStatusCodes.InTransit,
            DeliveryStatusCodes.Delivered,
            DeliveryStatusCodes.ReceivedByCustomer
        };

        if (!allowedDeliveryStatuses.Contains(status))
        {
            throw new InvalidOperationException("Only courier delivery statuses are allowed.");
        }

        var orderStatusId = await GetOrderStatusIdAsync(
            status == DeliveryStatusCodes.ReceivedByCustomer ? OrderStatusCodes.Completed : OrderStatusCodes.Active,
            cancellationToken);
        var deliveryStatusId = await GetDeliveryStatusIdAsync(status, cancellationToken);

        order.SetDeliveryStatus(status, orderStatusId, deliveryStatusId);
        await _orderRepository.SaveChangesAsync(cancellationToken);

        if (status == DeliveryStatusCodes.Delivered)
        {
            await _orderNotificationService.NotifyDeliveredAsync(order, cancellationToken);
        }

        return await MapOrderAsync(order, cancellationToken);
    }

    public async Task<OrderDto> UpdateStatusByAdminAsync(Guid id, UpdateOrderStatusByAdminRequestDto request, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Order not found.");

        var status = request.Status.Trim();

        if (!OrderStatusCodes.All.Contains(status, StringComparer.Ordinal) &&
            !DeliveryStatusCodes.All.Contains(status, StringComparer.Ordinal) &&
            !PaymentStatusCodes.All.Contains(status, StringComparer.Ordinal))
        {
            throw new InvalidOperationException("Invalid order status.");
        }

        if (status == OrderStatusCodes.Cancelled)
        {
            var cancelledOrderStatusId = await GetOrderStatusIdAsync(OrderStatusCodes.Cancelled, cancellationToken);
            order.Cancel(cancelledOrderStatusId);
        }
        else if (new[] { DeliveryStatusCodes.InAssembly, DeliveryStatusCodes.ReadyForPickup }.Contains(status))
        {
            var activeOrderStatusId = await GetOrderStatusIdAsync(OrderStatusCodes.Active, cancellationToken);
            var deliveryStatusId = await GetDeliveryStatusIdAsync(status, cancellationToken);
            order.SetAssemblyStatus(status, activeOrderStatusId, deliveryStatusId);
        }
        else if (status == DeliveryStatusCodes.ReceivedByCustomer && order.DeliveryMethod == DeliveryMethod.Pickup)
        {
            var completedOrderStatusId = await GetOrderStatusIdAsync(OrderStatusCodes.Completed, cancellationToken);
            var receivedByCustomerStatusId = await GetDeliveryStatusIdAsync(DeliveryStatusCodes.ReceivedByCustomer, cancellationToken);
            var paidPaymentStatusId = await GetPaymentStatusIdAsync(PaymentStatusCodes.Paid, cancellationToken);
            order.CompletePickup(completedOrderStatusId, receivedByCustomerStatusId, paidPaymentStatusId);
        }
        else if (new[] { DeliveryStatusCodes.InTransit, DeliveryStatusCodes.Delivered, DeliveryStatusCodes.ReceivedByCustomer }.Contains(status))
        {
            var orderStatusId = await GetOrderStatusIdAsync(
                status == DeliveryStatusCodes.ReceivedByCustomer ? OrderStatusCodes.Completed : OrderStatusCodes.Active,
                cancellationToken);
            var deliveryStatusId = await GetDeliveryStatusIdAsync(status, cancellationToken);
            Guid? paidPaymentStatusId = status == DeliveryStatusCodes.ReceivedByCustomer
                ? await GetPaymentStatusIdAsync(PaymentStatusCodes.Paid, cancellationToken)
                : null;
            order.SetDeliveryStatus(status, orderStatusId, deliveryStatusId, paidPaymentStatusId);
        }
        else if (status == PaymentStatusCodes.Paid)
        {
            var activeOrderStatusId = await GetOrderStatusIdAsync(OrderStatusCodes.Active, cancellationToken);
            var paidPaymentStatusId = await GetPaymentStatusIdAsync(PaymentStatusCodes.Paid, cancellationToken);
            order.MarkPaid(activeOrderStatusId);
            order.Payment?.MarkPaid(paidPaymentStatusId);
        }
        else
        {
            throw new InvalidOperationException("This status cannot be set manually.");
        }

        await _orderRepository.SaveChangesAsync(cancellationToken);
        return await MapOrderAsync(order, cancellationToken);
    }

    public async Task<OrderDto> CancelByAdminAsync(Guid id, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Order not found.");

        var cancelledOrderStatusId = await GetOrderStatusIdAsync(OrderStatusCodes.Cancelled, cancellationToken);
        order.Cancel(cancelledOrderStatusId);
        await _orderRepository.SaveChangesAsync(cancellationToken);
        return await MapOrderAsync(order, cancellationToken);
    }

    private async Task<OrderDto> MapOrderAsync(Order order, CancellationToken cancellationToken)
    {
        return (await MapOrdersAsync([order], cancellationToken)).Single();
    }

    private async Task<IReadOnlyCollection<OrderDto>> MapOrdersAsync(IEnumerable<Order> orders, CancellationToken cancellationToken)
    {
        var orderArray = orders.ToArray();
        var userIds = orderArray
            .SelectMany(order => new[] { order.CustomerId, order.FloristId, order.Delivery?.CourierId })
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Cast<string>()
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        var users = await _userDirectoryService.GetByIdsAsync(userIds, cancellationToken);

        return orderArray.Select(order =>
        {
            users.TryGetValue(order.CustomerId, out var customer);

            UserDirectoryDto? florist = null;
            if (!string.IsNullOrWhiteSpace(order.FloristId))
            {
                users.TryGetValue(order.FloristId, out florist);
            }

            UserDirectoryDto? courier = null;
            if (!string.IsNullOrWhiteSpace(order.Delivery?.CourierId))
            {
                users.TryGetValue(order.Delivery.CourierId!, out courier);
            }

            return new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerId = order.CustomerId,
                CustomerEmail = customer?.Email ?? string.Empty,
                CustomerFullName = customer?.FullName ?? string.Empty,
                Status = order.Status,
                DeliveryMethod = order.DeliveryMethod.ToString(),
                TotalAmount = order.TotalAmount,
                CreatedAtUtc = MoscowTime.AsOffset(order.CreatedAtUtc),
                DeliveryAddress = order.Delivery?.Address,
                FloristId = order.FloristId,
                FloristEmail = florist?.Email,
                FloristFullName = florist?.FullName,
                CourierId = order.Delivery?.CourierId,
                CourierEmail = courier?.Email,
                CourierFullName = courier?.FullName,
                DeliveryStatus = order.Delivery?.Status,
                PaymentStatus = order.Payment?.Status,
                PaymentProvider = order.Payment?.Provider,
                PaidAtUtc = order.Payment?.PaidAtUtc is null ? null : MoscowTime.AsOffset(order.Payment.PaidAtUtc.Value),
                Items = order.Items.Select(item => new OrderItemDto
                {
                    ProductId = item.ProductId,
                    ProductType = item.ProductType,
                    ProductName = item.ProductName,
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity
                }).ToArray()
            };
        }).ToArray();
    }

    private async Task<Guid> GetOrderStatusIdAsync(string name, CancellationToken cancellationToken)
    {
        var status = await _orderStatusReferenceRepository.GetByNameAsync(name, cancellationToken)
            ?? throw new InvalidOperationException($"Order status '{name}' not found.");
        return status.Id;
    }

    private async Task<Guid> GetDeliveryStatusIdAsync(string name, CancellationToken cancellationToken)
    {
        var status = await _deliveryStatusReferenceRepository.GetByNameAsync(name, cancellationToken)
            ?? throw new InvalidOperationException($"Delivery status '{name}' not found.");
        return status.Id;
    }

    private async Task<Guid> GetPaymentStatusIdAsync(string name, CancellationToken cancellationToken)
    {
        var status = await _paymentStatusReferenceRepository.GetByNameAsync(name, cancellationToken)
            ?? throw new InvalidOperationException($"Payment status '{name}' not found.");
        return status.Id;
    }
}
