namespace Flowoff.Domain.Enums;

public enum OrderStatus
{
    PendingPayment = 1,
    Paid = 2,
    Accepted = 3,
    InAssembly = 4,
    Assembled = 5,
    TransferredToCourier = 6,
    InTransit = 7,
    Delivered = 8,
    Cancelled = 9,
    ReceivedByCustomer = 10
}
