using Flowoff.Application.DTOs.Statistics;

namespace Flowoff.Application.Interfaces;

public interface IStatisticsService
{
    Task<AdminAnalyticsDto> GetDashboardAsync(DateOnly? dateFrom, DateOnly? dateTo, CancellationToken cancellationToken);
}
