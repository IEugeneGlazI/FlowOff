namespace Flowoff.Domain.Statuses;

public static class DeliveryStatusCodes
{
    public const string UnderReview = "Заказ на рассмотрении";
    public const string InAssembly = "Заказ собирается";
    public const string ReadyForPickup = "Заказ готов к выдаче";
    public const string TransferringToDelivery = "Заказ передается в доставку";
    public const string AcceptedByCourier = "Заказ принят в доставку";
    public const string InTransit = "Заказ в пути";
    public const string Delivered = "Заказ доставлен";
    public const string ReceivedByCustomer = "Заказ получен клиентом";

    public static readonly string[] All =
    [
        UnderReview,
        InAssembly,
        ReadyForPickup,
        TransferringToDelivery,
        AcceptedByCourier,
        InTransit,
        Delivered,
        ReceivedByCustomer
    ];
}
