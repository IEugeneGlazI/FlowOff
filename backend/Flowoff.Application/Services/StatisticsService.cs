using Flowoff.Application.DTOs.Statistics;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class StatisticsService : IStatisticsService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IReservationRepository _reservationRepository;
    private readonly ISupportRequestRepository _supportRequestRepository;

    public StatisticsService(
        IOrderRepository orderRepository,
        IReservationRepository reservationRepository,
        ISupportRequestRepository supportRequestRepository)
    {
        _orderRepository = orderRepository;
        _reservationRepository = reservationRepository;
        _supportRequestRepository = supportRequestRepository;
    }

    public async Task<DashboardStatisticsDto> GetDashboardAsync(CancellationToken cancellationToken)
    {
        var orders = await _orderRepository.GetAllAsync(cancellationToken);
        var reservations = await _reservationRepository.GetActiveAsync(cancellationToken);
        var supportRequests = await _supportRequestRepository.GetAllAsync(cancellationToken);

        return new DashboardStatisticsDto
        {
            TotalOrders = orders.Count,
            DeliveredOrders = orders.Count(order => order.Status == OrderStatus.Delivered),
            Revenue = orders
                .Where(order => order.Payment?.Status == PaymentStatus.Paid)
                .Sum(order => order.TotalAmount),
            ActiveReservations = reservations.Count,
            OpenSupportRequests = supportRequests.Count(request =>
                request.Status == SupportRequestStatus.Open || request.Status == SupportRequestStatus.InProgress)
        };
    }
}
