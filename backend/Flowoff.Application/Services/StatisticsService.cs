using Flowoff.Application.DTOs.Statistics;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class StatisticsService : IStatisticsService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ISupportRequestRepository _supportRequestRepository;

    public StatisticsService(
        IOrderRepository orderRepository,
        ISupportRequestRepository supportRequestRepository)
    {
        _orderRepository = orderRepository;
        _supportRequestRepository = supportRequestRepository;
    }

    public async Task<DashboardStatisticsDto> GetDashboardAsync(CancellationToken cancellationToken)
    {
        var orders = await _orderRepository.GetAllAsync(cancellationToken);
        var supportRequests = await _supportRequestRepository.GetAllAsync(cancellationToken);

        return new DashboardStatisticsDto
        {
            TotalOrders = orders.Count,
            DeliveredOrders = orders.Count(order => order.Status == OrderStatus.Delivered),
            Revenue = orders
                .Where(order => order.Payment?.Status == PaymentStatus.Paid)
                .Sum(order => order.TotalAmount),
            OpenSupportRequests = supportRequests.Count(request =>
                request.Status == SupportRequestStatus.Open || request.Status == SupportRequestStatus.InProgress)
        };
    }
}
