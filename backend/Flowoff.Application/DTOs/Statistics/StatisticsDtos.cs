namespace Flowoff.Application.DTOs.Statistics;

public sealed class AdminAnalyticsQueryDto
{
    public DateOnly? DateFrom { get; init; }
    public DateOnly? DateTo { get; init; }
}

public sealed class AdminAnalyticsDto
{
    public DateTimeOffset GeneratedAtUtc { get; init; }
    public DateOnly DateFrom { get; init; }
    public DateOnly DateTo { get; init; }
    public string TrendGranularity { get; init; } = "daily";
    public AnalyticsSummaryDto Summary { get; init; } = new();
    public IReadOnlyCollection<RevenuePeriodMetricDto> RevenueByPeriods { get; init; } = [];
    public IReadOnlyCollection<TrendPointDto> RevenueTrend { get; init; } = [];
    public IReadOnlyCollection<StatusMetricDto> OrderStatuses { get; init; } = [];
    public IReadOnlyCollection<StatusMetricDto> DeliveryStatuses { get; init; } = [];
    public IReadOnlyCollection<StatusMetricDto> PaymentStatuses { get; init; } = [];
    public IReadOnlyCollection<StatusMetricDto> DeliveryMethods { get; init; } = [];
    public IReadOnlyCollection<ProductTypeAnalyticsDto> ProductTypes { get; init; } = [];
    public IReadOnlyCollection<TopProductAnalyticsDto> TopProducts { get; init; } = [];
    public IReadOnlyCollection<EmployeePerformanceDto> Florists { get; init; } = [];
    public IReadOnlyCollection<EmployeePerformanceDto> Couriers { get; init; } = [];
}

public sealed class AnalyticsSummaryDto
{
    public int TotalOrders { get; init; }
    public int ActiveOrders { get; init; }
    public int CompletedOrders { get; init; }
    public int CancelledOrders { get; init; }
    public int DeliveryOrders { get; init; }
    public int PickupOrders { get; init; }
    public int PaidOrders { get; init; }
    public int PendingPaymentOrders { get; init; }
    public int OpenSupportRequests { get; init; }
    public int UniqueCustomers { get; init; }
    public decimal Revenue { get; init; }
    public decimal AverageOrderValue { get; init; }
}

public sealed class RevenuePeriodMetricDto
{
    public string Key { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public int OrdersCount { get; init; }
    public decimal Revenue { get; init; }
    public decimal AverageOrderValue { get; init; }
}

public sealed class TrendPointDto
{
    public string Label { get; init; } = string.Empty;
    public DateTimeOffset PeriodStartUtc { get; init; }
    public int OrdersCount { get; init; }
    public decimal Revenue { get; init; }
}

public sealed class StatusMetricDto
{
    public string Label { get; init; } = string.Empty;
    public int Count { get; init; }
}

public sealed class ProductTypeAnalyticsDto
{
    public string ProductType { get; init; } = string.Empty;
    public int ItemsSold { get; init; }
    public int OrdersCount { get; init; }
    public decimal Revenue { get; init; }
}

public sealed class TopProductAnalyticsDto
{
    public Guid ProductId { get; init; }
    public string ProductType { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public int QuantitySold { get; init; }
    public int OrdersCount { get; init; }
    public decimal Revenue { get; init; }
}

public sealed class EmployeePerformanceDto
{
    public string EmployeeId { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public int TotalAssignedOrders { get; init; }
    public int ActiveOrders { get; init; }
    public int CompletedOrders { get; init; }
    public int CancelledOrders { get; init; }
    public decimal RevenueHandled { get; init; }
    public decimal CompletionRatePercent { get; init; }
}
