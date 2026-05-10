namespace Flowoff.Domain.Statuses;

public static class PaymentStatusCodes
{
    public const string Pending = "Ожидает оплаты";
    public const string Paid = "Оплачен";
    public const string Failed = "Ошибка оплаты";
    public const string Refunded = "Возвращен";

    public static readonly string[] All =
    [
        Pending,
        Paid,
        Failed,
        Refunded
    ];
}
