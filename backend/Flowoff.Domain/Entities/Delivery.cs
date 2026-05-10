using Flowoff.Domain.Common;

using Flowoff.Domain.Statuses;

namespace Flowoff.Domain.Entities;

public class Delivery : Entity
{
    public Guid OrderId { get; private set; }
    public Order? Order { get; private set; }
    public string? CourierId { get; private set; }
    public string? Address { get; private set; }
    public string Status { get; private set; } = DeliveryStatusCodes.UnderReview;
    public Guid DeliveryStatusReferenceId { get; private set; }
    public DeliveryStatusReference? DeliveryStatusReference { get; private set; }
    public DateTime? DeliveredAtUtc { get; private set; }

    private Delivery()
    {
    }

    public Delivery(Guid orderId, string? address, Guid deliveryStatusReferenceId)
    {
        OrderId = orderId;
        Address = address;
        SetStatus(deliveryStatusReferenceId, DeliveryStatusCodes.UnderReview);
    }

    public void MarkInAssembly(Guid deliveryStatusReferenceId)
    {
        SetStatus(deliveryStatusReferenceId, DeliveryStatusCodes.InAssembly);
    }

    public void MarkReadyForPickup(Guid deliveryStatusReferenceId)
    {
        SetStatus(deliveryStatusReferenceId, DeliveryStatusCodes.ReadyForPickup);
    }

    public void MarkTransferringToDelivery(string courierId, Guid deliveryStatusReferenceId)
    {
        if (string.IsNullOrWhiteSpace(courierId))
        {
            throw new ArgumentOutOfRangeException(nameof(courierId));
        }

        CourierId = courierId;
        SetStatus(deliveryStatusReferenceId, DeliveryStatusCodes.TransferringToDelivery);
    }

    public void AcceptByCourier(string courierId, Guid deliveryStatusReferenceId)
    {
        if (string.IsNullOrWhiteSpace(courierId))
        {
            throw new ArgumentOutOfRangeException(nameof(courierId));
        }

        CourierId = courierId;
        SetStatus(deliveryStatusReferenceId, DeliveryStatusCodes.AcceptedByCourier);
    }

    public void SetStatus(Guid deliveryStatusReferenceId, string status)
    {
        DeliveryStatusReferenceId = deliveryStatusReferenceId;
        Status = status;
    }

    public void MarkDelivered(Guid deliveryStatusReferenceId)
    {
        SetStatus(deliveryStatusReferenceId, DeliveryStatusCodes.Delivered);
        DeliveredAtUtc = DateTime.UtcNow;
    }
}
