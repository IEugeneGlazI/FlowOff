using Flowoff.Domain.Common;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Statuses;

namespace Flowoff.Domain.Entities;

public class Order : Entity
{
    public int OrderNumber { get; private set; }
    public string CustomerId { get; private set; } = string.Empty;
    public string? FloristId { get; private set; }
    public DeliveryMethod DeliveryMethod { get; private set; }
    public string Status { get; private set; } = OrderStatusCodes.Active;
    public Guid OrderStatusReferenceId { get; private set; }
    public OrderStatusReference? OrderStatusReference { get; private set; }
    public decimal TotalAmount { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = MoscowTime.Now();
    public ICollection<OrderItem> Items { get; private set; } = [];
    public Delivery? Delivery { get; private set; }
    public Payment? Payment { get; private set; }

    private Order()
    {
    }

    public Order(
        int orderNumber,
        string customerId,
        DeliveryMethod deliveryMethod,
        IEnumerable<OrderItem> items,
        decimal totalAmount,
        Guid orderStatusReferenceId)
    {
        OrderNumber = orderNumber;
        CustomerId = customerId;
        DeliveryMethod = deliveryMethod;
        SetOrderStatus(orderStatusReferenceId, OrderStatusCodes.Active);
        TotalAmount = totalAmount;
        Items = items.ToList();
    }

    public void MarkPaid(Guid orderStatusReferenceId)
    {
        SetOrderStatus(orderStatusReferenceId, OrderStatusCodes.Active);
    }

    public void AllowPickupPayment()
    {
        if (DeliveryMethod != DeliveryMethod.Pickup)
        {
            throw new InvalidOperationException("Pickup payment is available for pickup orders only.");
        }
    }

    public void SetAssemblyStatus(string status, Guid orderStatusReferenceId, Guid deliveryStatusReferenceId)
    {
        var allowedStatuses = new[]
        {
            DeliveryStatusCodes.InAssembly,
            DeliveryStatusCodes.ReadyForPickup
        };

        if (!allowedStatuses.Contains(status))
        {
            throw new InvalidOperationException("Invalid assembly status.");
        }

        if (Status == OrderStatusCodes.Cancelled || Status == OrderStatusCodes.Completed)
        {
            throw new InvalidOperationException("Completed or cancelled orders cannot enter assembly workflow.");
        }

        if (Delivery is null)
        {
            throw new InvalidOperationException("Order fulfillment state is not initialized.");
        }

        if (status == DeliveryStatusCodes.InAssembly)
        {
            Delivery.MarkInAssembly(deliveryStatusReferenceId);
        }
        else if (status == DeliveryStatusCodes.ReadyForPickup)
        {
            Delivery.MarkReadyForPickup(deliveryStatusReferenceId);
        }

        SetOrderStatus(orderStatusReferenceId, OrderStatusCodes.Active);
    }

    public void AssignFlorist(string floristId)
    {
        if (string.IsNullOrWhiteSpace(floristId))
        {
            throw new ArgumentOutOfRangeException(nameof(floristId));
        }

        FloristId = floristId;
    }

    public void SetDeliveryStatus(
        string status,
        Guid orderStatusReferenceId,
        Guid deliveryStatusReferenceId,
        Guid? paymentStatusReferenceId = null)
    {
        var allowedStatuses = new[]
        {
            DeliveryStatusCodes.InTransit,
            DeliveryStatusCodes.Delivered,
            DeliveryStatusCodes.ReceivedByCustomer
        };

        if (!allowedStatuses.Contains(status))
        {
            throw new InvalidOperationException("Invalid delivery status.");
        }

        if (Delivery is null || string.IsNullOrWhiteSpace(Delivery.CourierId))
        {
            throw new InvalidOperationException("Courier must be assigned before delivery workflow starts.");
        }

        if (status == DeliveryStatusCodes.InTransit)
        {
            Delivery.SetStatus(deliveryStatusReferenceId, DeliveryStatusCodes.InTransit);
            SetOrderStatus(orderStatusReferenceId, OrderStatusCodes.Active);
        }

        if (status == DeliveryStatusCodes.Delivered)
        {
            Delivery.MarkDelivered(deliveryStatusReferenceId);
            SetOrderStatus(orderStatusReferenceId, OrderStatusCodes.Active);
        }

        if (status == DeliveryStatusCodes.ReceivedByCustomer)
        {
            if (DeliveryMethod != DeliveryMethod.Delivery)
            {
                throw new InvalidOperationException("Only delivery orders can be marked as received by customer in courier workflow.");
            }

            if (Delivery.Status != DeliveryStatusCodes.Delivered)
            {
                throw new InvalidOperationException("Order can be marked as received by customer only after delivery is completed.");
            }

            Delivery.SetStatus(deliveryStatusReferenceId, DeliveryStatusCodes.ReceivedByCustomer);
            SetOrderStatus(orderStatusReferenceId, OrderStatusCodes.Completed);

            if (Payment?.Status == PaymentStatusCodes.Pending && paymentStatusReferenceId.HasValue)
            {
                Payment.MarkPaid(paymentStatusReferenceId.Value);
            }
        }
    }

    public void CompletePickup(Guid orderStatusReferenceId, Guid deliveryStatusReferenceId, Guid? paymentStatusReferenceId = null)
    {
        if (DeliveryMethod != DeliveryMethod.Pickup)
        {
            throw new InvalidOperationException("Only pickup orders can be completed by florist.");
        }

        if (Delivery?.Status != DeliveryStatusCodes.ReadyForPickup)
        {
            throw new InvalidOperationException("Pickup order can be completed only after it is ready for pickup.");
        }

        if (Payment?.Status == PaymentStatusCodes.Pending && paymentStatusReferenceId.HasValue)
        {
            Payment.MarkPaid(paymentStatusReferenceId.Value);
        }

        Delivery!.SetStatus(deliveryStatusReferenceId, DeliveryStatusCodes.ReceivedByCustomer);
        SetOrderStatus(orderStatusReferenceId, OrderStatusCodes.Completed);
    }

    public void Cancel(Guid orderStatusReferenceId)
    {
        if (Status == OrderStatusCodes.Completed)
        {
            throw new InvalidOperationException("Completed order cannot be cancelled.");
        }

        SetOrderStatus(orderStatusReferenceId, OrderStatusCodes.Cancelled);
    }

    public void AttachDelivery(Delivery delivery)
    {
        Delivery = delivery;
    }

    public void AttachPayment(Payment payment)
    {
        Payment = payment;
    }

    public void AssignCourier(string courierId, Guid orderStatusReferenceId, Guid deliveryStatusReferenceId)
    {
        if (Delivery is null)
        {
            throw new InvalidOperationException("Only delivery orders can be assigned to courier.");
        }

        if (DeliveryMethod != DeliveryMethod.Delivery)
        {
            throw new InvalidOperationException("Courier can only be assigned for delivery orders.");
        }

        if (Delivery.Status != DeliveryStatusCodes.ReadyForPickup &&
            Delivery.Status != DeliveryStatusCodes.TransferringToDelivery &&
            Delivery.Status != DeliveryStatusCodes.AcceptedByCourier)
        {
            throw new InvalidOperationException("Courier can only be assigned after order is ready for transfer.");
        }

        Delivery.MarkTransferringToDelivery(courierId, deliveryStatusReferenceId);
        SetOrderStatus(orderStatusReferenceId, OrderStatusCodes.Active);
    }

    public void AcceptByCourier(string courierId, Guid orderStatusReferenceId, Guid deliveryStatusReferenceId)
    {
        if (Delivery is null)
        {
            throw new InvalidOperationException("Only delivery orders can be accepted by courier.");
        }

        if (DeliveryMethod != DeliveryMethod.Delivery)
        {
            throw new InvalidOperationException("Only delivery orders can be accepted by courier.");
        }

        if (Delivery.Status != DeliveryStatusCodes.ReadyForPickup &&
            Delivery.Status != DeliveryStatusCodes.TransferringToDelivery &&
            Delivery.Status != DeliveryStatusCodes.AcceptedByCourier)
        {
            throw new InvalidOperationException("Order is not ready for courier acceptance.");
        }

        Delivery.AcceptByCourier(courierId, deliveryStatusReferenceId);
        SetOrderStatus(orderStatusReferenceId, OrderStatusCodes.Active);
    }

    private void SetOrderStatus(Guid referenceId, string status)
    {
        OrderStatusReferenceId = referenceId;
        Status = status;
    }
}
