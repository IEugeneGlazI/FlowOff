using Flowoff.Application.DTOs.Orders;

namespace Flowoff.Application.Interfaces;

public interface IOrderService
{
    Task<OrderDto> CreateAsync(CreateOrderRequestDto request, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<OrderDto>> GetMyOrdersAsync(CancellationToken cancellationToken);
    Task<IReadOnlyCollection<OrderDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<OrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<OrderDto> UpdateAssemblyStatusAsync(Guid id, UpdateAssemblyStatusRequestDto request, CancellationToken cancellationToken);
    Task<OrderDto> AssignCourierAsync(Guid id, AssignCourierRequestDto request, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<OrderDto>> GetAssignedToCourierAsync(CancellationToken cancellationToken);
    Task<OrderDto> UpdateDeliveryStatusAsync(Guid id, UpdateDeliveryStatusRequestDto request, CancellationToken cancellationToken);
}
