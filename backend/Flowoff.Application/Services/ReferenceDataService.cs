using Flowoff.Application.DTOs.References;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class ReferenceDataService : IReferenceDataService
{
    private readonly IOrderStatusReferenceRepository _orderStatusReferenceRepository;
    private readonly IDeliveryStatusReferenceRepository _deliveryStatusReferenceRepository;
    private readonly IPaymentStatusReferenceRepository _paymentStatusReferenceRepository;

    public ReferenceDataService(
        IOrderStatusReferenceRepository orderStatusReferenceRepository,
        IDeliveryStatusReferenceRepository deliveryStatusReferenceRepository,
        IPaymentStatusReferenceRepository paymentStatusReferenceRepository)
    {
        _orderStatusReferenceRepository = orderStatusReferenceRepository;
        _deliveryStatusReferenceRepository = deliveryStatusReferenceRepository;
        _paymentStatusReferenceRepository = paymentStatusReferenceRepository;
    }

    public async Task<IReadOnlyCollection<StatusReferenceItemDto>> GetStatusesAsync(CancellationToken cancellationToken)
    {
        var orderStatuses = await _orderStatusReferenceRepository.GetAllAsync(cancellationToken);
        var deliveryStatuses = await _deliveryStatusReferenceRepository.GetAllAsync(cancellationToken);
        var paymentStatuses = await _paymentStatusReferenceRepository.GetAllAsync(cancellationToken);

        return
        [
            .. orderStatuses.Select(status => new StatusReferenceItemDto
            {
                Id = status.Id,
                Group = "order",
                Name = status.Name
            }),
            .. deliveryStatuses.Select(status => new StatusReferenceItemDto
            {
                Id = status.Id,
                Group = "delivery",
                Name = status.Name
            }),
            .. paymentStatuses.Select(status => new StatusReferenceItemDto
            {
                Id = status.Id,
                Group = "payment",
                Name = status.Name
            })
        ];
    }
}
