namespace Flowoff.Domain.Statuses;

public static class SupportStatusCodes
{
    public const string New = "Новое";
    public const string InProgress = "В работе";
    public const string WaitingForUser = "Ожидает ответа пользователя";
    public const string Resolved = "Решено";
    public const string Closed = "Закрыто";

    public static readonly string[] All =
    [
        New,
        InProgress,
        WaitingForUser,
        Resolved,
        Closed
    ];

    public static readonly string[] OpenStatuses =
    [
        New,
        InProgress,
        WaitingForUser
    ];
}
