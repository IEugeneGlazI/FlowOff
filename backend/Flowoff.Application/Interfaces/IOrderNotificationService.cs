using Flowoff.Domain.Entities;

namespace Flowoff.Application.Interfaces;

public interface IOrderNotificationService
{
    Task NotifyPickupReadyAsync(Order order, CancellationToken cancellationToken);
    Task NotifyTransferredToDeliveryAsync(Order order, CancellationToken cancellationToken);
    Task NotifyDeliveredAsync(Order order, CancellationToken cancellationToken);
}
