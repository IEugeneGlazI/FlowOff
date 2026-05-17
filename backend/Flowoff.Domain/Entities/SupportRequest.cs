using Flowoff.Domain.Common;
using Flowoff.Domain.Statuses;

namespace Flowoff.Domain.Entities;

public class SupportRequest : Entity
{
    public string CustomerId { get; private set; } = string.Empty;
    public Guid? OrderId { get; private set; }
    public Order? Order { get; private set; }
    public string Subject { get; private set; } = string.Empty;
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
        Guid supportStatusReferenceId)
    {
        CustomerId = customerId;
        Subject = subject;
        OrderId = orderId;
        SupportStatusReferenceId = supportStatusReferenceId;
    }

    public void AddMessage(SupportRequestMessage message)
    {
        Messages.Add(message);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetStatus(Guid supportStatusReferenceId, string statusName)
    {
        SupportStatusReferenceId = supportStatusReferenceId;
        UpdatedAtUtc = DateTime.UtcNow;
        ClosedAtUtc = SupportStatusCodes.ClosedStatuses.Contains(statusName)
            ? UpdatedAtUtc
            : null;
    }
}
