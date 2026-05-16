using Flowoff.Domain.Common;
using Flowoff.Domain.Statuses;

namespace Flowoff.Domain.Entities;

public class SupportRequest : Entity
{
    public string CustomerId { get; private set; } = string.Empty;
    public Guid? OrderId { get; private set; }
    public Order? Order { get; private set; }
    public string Subject { get; private set; } = string.Empty;
    public string Status { get; private set; } = SupportStatusCodes.New;
    public Guid SupportStatusReferenceId { get; private set; }
    public SupportStatusReference? SupportStatusReference { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime? ClosedAtUtc { get; private set; }
    public ICollection<SupportRequestMessage> Messages { get; private set; } = [];

    private SupportRequest()
    {
    }

    public SupportRequest(
        string customerId,
        string subject,
        Guid? orderId,
        Guid supportStatusReferenceId,
        string status)
    {
        CustomerId = customerId;
        Subject = subject;
        OrderId = orderId;
        SupportStatusReferenceId = supportStatusReferenceId;
        Status = status;
    }

    public void AddMessage(SupportRequestMessage message)
    {
        Messages.Add(message);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetStatus(Guid supportStatusReferenceId, string status)
    {
        SupportStatusReferenceId = supportStatusReferenceId;
        Status = status;
        UpdatedAtUtc = DateTime.UtcNow;
        ClosedAtUtc = status is SupportStatusCodes.Resolved or SupportStatusCodes.Closed
            ? UpdatedAtUtc
            : null;
    }
}
