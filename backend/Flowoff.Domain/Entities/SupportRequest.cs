using Flowoff.Domain.Common;
using Flowoff.Domain.Enums;

namespace Flowoff.Domain.Entities;

public class SupportRequest : Entity
{
    public string CustomerId { get; private set; } = string.Empty;
    public string Subject { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public SupportRequestStatus Status { get; private set; } = SupportRequestStatus.Open;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private SupportRequest()
    {
    }

    public SupportRequest(string customerId, string subject, string message)
    {
        CustomerId = customerId;
        Subject = subject;
        Message = message;
    }

    public void SetStatus(SupportRequestStatus status)
    {
        Status = status;
    }
}
