using Flowoff.Domain.Common;
using Flowoff.Domain.Enums;

namespace Flowoff.Domain.Entities;

public class Reservation : Entity
{
    public string CustomerId { get; private set; } = string.Empty;
    public Guid ProductId { get; private set; }
    public Product? Product { get; private set; }
    public DateTime StartAtUtc { get; private set; }
    public DateTime EndAtUtc { get; private set; }
    public ReservationStatus Status { get; private set; }

    private Reservation()
    {
    }

    public Reservation(string customerId, Guid productId, DateTime startAtUtc, DateTime endAtUtc)
    {
        CustomerId = customerId;
        ProductId = productId;
        StartAtUtc = startAtUtc;
        EndAtUtc = endAtUtc;
        Status = ReservationStatus.Active;
    }

    public void Cancel()
    {
        if (Status != ReservationStatus.Active)
        {
            throw new InvalidOperationException("Only active reservations can be cancelled.");
        }

        Status = ReservationStatus.Cancelled;
    }

    public void Expire()
    {
        if (Status == ReservationStatus.Active)
        {
            Status = ReservationStatus.Expired;
        }
    }

    public bool Overlaps(DateTime startAtUtc, DateTime endAtUtc)
    {
        return Status == ReservationStatus.Active && StartAtUtc < endAtUtc && startAtUtc < EndAtUtc;
    }
}
