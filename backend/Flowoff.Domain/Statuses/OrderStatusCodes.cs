namespace Flowoff.Domain.Statuses;

public static class OrderStatusCodes
{
    public const string Active = "Активен";
    public const string Completed = "Завершен";
    public const string Cancelled = "Отменен";

    public static readonly string[] All =
    [
        Active,
        Completed,
        Cancelled
    ];
}
