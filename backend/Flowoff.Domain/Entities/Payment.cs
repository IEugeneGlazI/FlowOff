using Flowoff.Domain.Common;
using Flowoff.Domain.Enums;

namespace Flowoff.Domain.Entities;

public class Payment : Entity
{
    public Guid OrderId { get; private set; }
    public Order? Order { get; private set; }
    public decimal Amount { get; private set; }
    public PaymentStatus Status { get; private set; }
    public string Provider { get; private set; } = string.Empty;
    public DateTime? PaidAtUtc { get; private set; }

    private Payment()
    {
    }

    public Payment(Guid orderId, decimal amount, string provider, PaymentStatus status)
    {
        OrderId = orderId;
        Amount = amount;
        Provider = provider;
        Status = status;
        PaidAtUtc = status == PaymentStatus.Paid ? DateTime.UtcNow : null;
    }
}
