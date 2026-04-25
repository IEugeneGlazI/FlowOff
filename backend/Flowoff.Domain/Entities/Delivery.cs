using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class Delivery : Entity
{
    public Guid OrderId { get; private set; }
    public Order? Order { get; private set; }
    public string? CourierId { get; private set; }
    public string? Address { get; private set; }
    public DateTime? DeliveredAtUtc { get; private set; }

    private Delivery()
    {
    }

    public Delivery(Guid orderId, string? address)
    {
        OrderId = orderId;
        Address = address;
    }

    public void AssignCourier(string courierId)
    {
        if (string.IsNullOrWhiteSpace(courierId))
        {
            throw new ArgumentOutOfRangeException(nameof(courierId));
        }

        CourierId = courierId;
    }

    public void MarkDelivered()
    {
        DeliveredAtUtc = DateTime.UtcNow;
    }
}
