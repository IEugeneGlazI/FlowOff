using Flowoff.Domain.Common;
using Flowoff.Domain.Statuses;

namespace Flowoff.Domain.Entities;

public class Payment : Entity
{
    public Guid OrderId { get; private set; }
    public Order? Order { get; private set; }
    public decimal Amount { get; private set; }
    public string Status { get; private set; } = PaymentStatusCodes.Pending;
    public Guid PaymentStatusReferenceId { get; private set; }
    public PaymentStatusReference? PaymentStatusReference { get; private set; }
    public string Provider { get; private set; } = string.Empty;
    public DateTime? PaidAtUtc { get; private set; }

    private Payment()
    {
    }

    public Payment(Guid orderId, decimal amount, string provider, string status, Guid paymentStatusReferenceId)
    {
        OrderId = orderId;
        Amount = amount;
        Provider = provider;
        SetStatus(paymentStatusReferenceId, status);
        PaidAtUtc = status == PaymentStatusCodes.Paid ? DateTime.UtcNow : null;
    }

    public void MarkPaid(Guid paymentStatusReferenceId)
    {
        SetStatus(paymentStatusReferenceId, PaymentStatusCodes.Paid);
        PaidAtUtc = DateTime.UtcNow;
    }

    private void SetStatus(Guid paymentStatusReferenceId, string status)
    {
        PaymentStatusReferenceId = paymentStatusReferenceId;
        Status = status;
    }
}
