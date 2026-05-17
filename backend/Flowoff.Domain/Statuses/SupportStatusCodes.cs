namespace Flowoff.Domain.Statuses;

public static class SupportStatusCodes
{
    public const string New = "Новое";
    public const string InProgress = "В работе";
    public const string Resolved = "Решено";
    public const string Rejected = "Отклонено";

    public static readonly string[] All =
    [
        New,
        InProgress,
        Resolved,
        Rejected
    ];

    public static readonly string[] OpenStatuses =
    [
        New,
        InProgress
    ];

    public static readonly string[] ClosedStatuses =
    [
        Resolved,
        Rejected
    ];
}
