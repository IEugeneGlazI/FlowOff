using Flowoff.Domain.Common;
using Flowoff.Domain.Enums;

namespace Flowoff.Domain.Entities;

public class Order : Entity
{
    public string CustomerId { get; private set; } = string.Empty;
    public DeliveryMethod DeliveryMethod { get; private set; }
    public OrderStatus Status { get; private set; }
    public decimal TotalAmount { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = MoscowTime.Now();
    public ICollection<OrderItem> Items { get; private set; } = [];
    public Delivery? Delivery { get; private set; }
    public Payment? Payment { get; private set; }

    private Order()
    {
    }

    public Order(string customerId, DeliveryMethod deliveryMethod, IEnumerable<OrderItem> items, decimal totalAmount)
    {
        CustomerId = customerId;
        DeliveryMethod = deliveryMethod;
        Status = OrderStatus.PendingPayment;
        TotalAmount = totalAmount;
        Items = items.ToList();
    }

    public void MarkPaid()
    {
        Status = OrderStatus.Paid;
    }

    public void AllowPickupPayment()
    {
        if (DeliveryMethod != DeliveryMethod.Pickup)
        {
            throw new InvalidOperationException("Pickup payment is available for pickup orders only.");
        }
    }

    public void SetAssemblyStatus(OrderStatus status)
    {
        var allowedStatuses = new[]
        {
            OrderStatus.Accepted,
            OrderStatus.InAssembly,
            OrderStatus.Assembled,
            OrderStatus.TransferredToCourier
        };

        if (!allowedStatuses.Contains(status))
        {
            throw new InvalidOperationException("Invalid assembly status.");
        }

        if (Status == OrderStatus.PendingPayment && DeliveryMethod != DeliveryMethod.Pickup)
        {
            throw new InvalidOperationException("Paid or pickup orders only can enter assembly workflow.");
        }

        Status = status;
    }

    public void SetDeliveryStatus(OrderStatus status)
    {
        var allowedStatuses = new[]
        {
            OrderStatus.InTransit,
            OrderStatus.Delivered
        };

        if (!allowedStatuses.Contains(status))
        {
            throw new InvalidOperationException("Invalid delivery status.");
        }

        if (Delivery is null || string.IsNullOrWhiteSpace(Delivery.CourierId))
        {
            throw new InvalidOperationException("Courier must be assigned before delivery workflow starts.");
        }

        if (status == OrderStatus.Delivered)
        {
            Delivery.MarkDelivered();
        }

        Status = status;
    }

    public void AttachDelivery(Delivery delivery)
    {
        Delivery = delivery;
    }

    public void AttachPayment(Payment payment)
    {
        Payment = payment;
    }

    public void AssignCourier(string courierId)
    {
        if (Delivery is null)
        {
            throw new InvalidOperationException("Only delivery orders can be assigned to courier.");
        }

        if (Status != OrderStatus.Assembled && Status != OrderStatus.TransferredToCourier)
        {
            throw new InvalidOperationException("Courier can only be assigned after assembly is completed.");
        }

        Delivery.AssignCourier(courierId);
        Status = OrderStatus.TransferredToCourier;
    }
}
