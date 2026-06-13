using Flowoff.Domain.Common;
using Flowoff.Domain.Statuses;
using System.ComponentModel.DataAnnotations.Schema;

namespace Flowoff.Domain.Entities;

public class Delivery : Entity
{
    public Guid OrderId { get; private set; }
    public Order? Order { get; private set; }
    public string? CourierId { get; private set; }
    public string? Address { get; private set; }
    public Guid DeliveryStatusReferenceId { get; private set; }
    public DeliveryStatusReference? DeliveryStatusReference { get; private set; }
    public DateTime? DeliveredAtUtc { get; private set; }
    [NotMapped]
    public string Status => DeliveryStatusReference?.Name ?? _statusName;

    [NotMapped]
    private string _statusName = DeliveryStatusCodes.UnderReview;

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
        _statusName = status;
    }

    public void MarkDelivered(Guid deliveryStatusReferenceId)
    {
        SetStatus(deliveryStatusReferenceId, DeliveryStatusCodes.Delivered);
        DeliveredAtUtc = DateTime.UtcNow;
    }

    public void ClearCourierAssignment()
    {
        CourierId = null;
    }

    public void SetStatusByAdmin(Guid deliveryStatusReferenceId, string status)
    {
        SetStatus(deliveryStatusReferenceId, status);

        if (status == DeliveryStatusCodes.Delivered || status == DeliveryStatusCodes.ReceivedByCustomer)
        {
            DeliveredAtUtc ??= DateTime.UtcNow;
            return;
        }

        DeliveredAtUtc = null;
    }
}
