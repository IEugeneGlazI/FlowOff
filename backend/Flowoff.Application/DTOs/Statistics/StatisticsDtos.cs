namespace Flowoff.Application.DTOs.Statistics;

public sealed class DashboardStatisticsDto
{
    public int TotalOrders { get; init; }
    public int DeliveredOrders { get; init; }
    public decimal Revenue { get; init; }
    public int ActiveReservations { get; init; }
    public int OpenSupportRequests { get; init; }
}
