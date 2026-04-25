using Flowoff.Application.DTOs.Statistics;

namespace Flowoff.Application.Interfaces;

public interface IStatisticsService
{
    Task<DashboardStatisticsDto> GetDashboardAsync(CancellationToken cancellationToken);
}
