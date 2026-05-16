using Flowoff.Application.DTOs.Statistics;
using Flowoff.Application.DTOs.Users;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;
using Flowoff.Domain.Statuses;

namespace Flowoff.Application.Services;

public class StatisticsService : IStatisticsService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ISupportRequestRepository _supportRequestRepository;
    private readonly IUserDirectoryService _userDirectoryService;

    public StatisticsService(
        IOrderRepository orderRepository,
        ISupportRequestRepository supportRequestRepository,
        IUserDirectoryService userDirectoryService)
    {
        _orderRepository = orderRepository;
        _supportRequestRepository = supportRequestRepository;
        _userDirectoryService = userDirectoryService;
    }

    public async Task<AdminAnalyticsDto> GetDashboardAsync(DateOnly? dateFrom, DateOnly? dateTo, CancellationToken cancellationToken)
    {
        var allOrders = (await _orderRepository.GetAllAsync(cancellationToken)).ToArray();
        var allSupportRequests = (await _supportRequestRepository.GetAllAsync(cancellationToken)).ToArray();
        var now = DateTimeOffset.UtcNow;
        var today = DateOnly.FromDateTime(now.UtcDateTime);
        var (rangeFrom, rangeTo) = ResolveRange(dateFrom, dateTo, now);
        var rangeStartUtc = rangeFrom.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var rangeEndUtcExclusive = rangeTo.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var orders = allOrders
            .Where(order => order.CreatedAtUtc >= rangeStartUtc && order.CreatedAtUtc < rangeEndUtcExclusive)
            .ToArray();
        var supportRequests = allSupportRequests
            .Where(request => request.CreatedAtUtc >= rangeStartUtc && request.CreatedAtUtc < rangeEndUtcExclusive)
            .ToArray();
        var paidOrders = orders.Where(IsPaidOrder).ToArray();
        var allPaidOrders = allOrders.Where(IsPaidOrder).ToArray();

        var userIds = orders
            .Select(order => order.FloristId)
            .Concat(orders.Select(order => order.Delivery?.CourierId))
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Cast<string>()
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        var userDirectory = await _userDirectoryService.GetByIdsAsync(userIds, cancellationToken);
        var trendGranularity = GetTrendGranularity(rangeFrom, rangeTo);

        return new AdminAnalyticsDto
        {
            GeneratedAtUtc = now,
            DateFrom = rangeFrom,
            DateTo = rangeTo,
            TrendGranularity = trendGranularity,
            Summary = BuildSummary(orders, paidOrders, supportRequests),
            RevenueByPeriods = BuildRevenuePeriods(allPaidOrders, rangeFrom, rangeTo, today),
            RevenueTrend = BuildRevenueTrend(allPaidOrders, rangeFrom, rangeTo, trendGranularity),
            OrderStatuses = BuildOrderStatuses(orders),
            DeliveryStatuses = BuildDeliveryStatuses(orders),
            PaymentStatuses = BuildPaymentStatuses(orders),
            DeliveryMethods = BuildDeliveryMethods(orders),
            ProductTypes = BuildProductTypeAnalytics(orders),
            TopProducts = BuildTopProducts(orders),
            Florists = BuildFloristPerformance(orders, userDirectory),
            Couriers = BuildCourierPerformance(orders, userDirectory),
        };
    }

    private static (DateOnly DateFrom, DateOnly DateTo) ResolveRange(DateOnly? dateFrom, DateOnly? dateTo, DateTimeOffset now)
    {
        var today = DateOnly.FromDateTime(now.UtcDateTime);
        var resolvedTo = dateTo ?? today;
        var resolvedFrom = dateFrom ?? resolvedTo.AddDays(-29);

        if (resolvedFrom > resolvedTo)
        {
            (resolvedFrom, resolvedTo) = (resolvedTo, resolvedFrom);
        }

        return (resolvedFrom, resolvedTo);
    }

    private static string GetTrendGranularity(DateOnly dateFrom, DateOnly dateTo)
    {
        var days = dateTo.DayNumber - dateFrom.DayNumber + 1;
        return days <= 31 ? "daily" : "monthly";
    }

    private static AnalyticsSummaryDto BuildSummary(
        IReadOnlyCollection<Order> orders,
        IReadOnlyCollection<Order> paidOrders,
        IReadOnlyCollection<SupportRequest> supportRequests)
    {
        var totalRevenue = paidOrders.Sum(order => order.TotalAmount);

        return new AnalyticsSummaryDto
        {
            TotalOrders = orders.Count,
            ActiveOrders = orders.Count(order => order.Status == OrderStatusCodes.Active),
            CompletedOrders = orders.Count(order => order.Status == OrderStatusCodes.Completed),
            CancelledOrders = orders.Count(order => order.Status == OrderStatusCodes.Cancelled),
            DeliveryOrders = orders.Count(order => order.DeliveryMethod == DeliveryMethod.Delivery),
            PickupOrders = orders.Count(order => order.DeliveryMethod == DeliveryMethod.Pickup),
            PaidOrders = paidOrders.Count,
            PendingPaymentOrders = orders.Count(order => order.Payment?.Status == PaymentStatusCodes.Pending),
            OpenSupportRequests = supportRequests.Count(request => SupportStatusCodes.OpenStatuses.Contains(request.Status)),
            UniqueCustomers = orders
                .Select(order => order.CustomerId)
                .Where(customerId => !string.IsNullOrWhiteSpace(customerId))
                .Distinct(StringComparer.Ordinal)
                .Count(),
            Revenue = totalRevenue,
            AverageOrderValue = paidOrders.Count == 0 ? 0 : Math.Round(totalRevenue / paidOrders.Count, 2),
        };
    }

    private static IReadOnlyCollection<RevenuePeriodMetricDto> BuildRevenuePeriods(
        IReadOnlyCollection<Order> paidOrders,
        DateOnly rangeFrom,
        DateOnly rangeTo,
        DateOnly today)
    {
        return
        [
            BuildRevenuePeriod("selected", "Выбранный период", paidOrders, rangeFrom, rangeTo),
            BuildRevenuePeriod("month", "Текущий месяц", paidOrders, new DateOnly(today.Year, today.Month, 1), today),
            BuildRevenuePeriod("year", "Текущий год", paidOrders, new DateOnly(today.Year, 1, 1), today),
            BuildRevenuePeriod("all", "За все время", paidOrders, null, null),
        ];
    }

    private static RevenuePeriodMetricDto BuildRevenuePeriod(
        string key,
        string label,
        IReadOnlyCollection<Order> paidOrders,
        DateOnly? from,
        DateOnly? to)
    {
        var scopedOrders = paidOrders
            .Where(order => IsWithinRange(order.CreatedAtUtc, from, to))
            .ToArray();
        var revenue = scopedOrders.Sum(order => order.TotalAmount);

        return new RevenuePeriodMetricDto
        {
            Key = key,
            Label = label,
            OrdersCount = scopedOrders.Length,
            Revenue = revenue,
            AverageOrderValue = scopedOrders.Length == 0 ? 0 : Math.Round(revenue / scopedOrders.Length, 2),
        };
    }

    private static IReadOnlyCollection<TrendPointDto> BuildRevenueTrend(
        IReadOnlyCollection<Order> paidOrders,
        DateOnly rangeFrom,
        DateOnly rangeTo,
        string granularity)
    {
        return granularity == "monthly"
            ? BuildMonthlyTrend(paidOrders, rangeFrom, rangeTo)
            : BuildDailyTrend(paidOrders, rangeFrom, rangeTo);
    }

    private static IReadOnlyCollection<TrendPointDto> BuildDailyTrend(
        IReadOnlyCollection<Order> paidOrders,
        DateOnly rangeFrom,
        DateOnly rangeTo)
    {
        var days = rangeTo.DayNumber - rangeFrom.DayNumber + 1;

        return Enumerable.Range(0, days)
            .Select(offset => rangeFrom.AddDays(offset))
            .Select(day =>
            {
                var dayStart = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
                var nextDay = day.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
                var scopedOrders = paidOrders
                    .Where(order => order.CreatedAtUtc >= dayStart && order.CreatedAtUtc < nextDay)
                    .ToArray();

                return new TrendPointDto
                {
                    Label = day.ToString("dd.MM"),
                    PeriodStartUtc = new DateTimeOffset(dayStart, TimeSpan.Zero),
                    OrdersCount = scopedOrders.Length,
                    Revenue = scopedOrders.Sum(order => order.TotalAmount),
                };
            })
            .ToArray();
    }

    private static IReadOnlyCollection<TrendPointDto> BuildMonthlyTrend(
        IReadOnlyCollection<Order> paidOrders,
        DateOnly rangeFrom,
        DateOnly rangeTo)
    {
        var monthStart = new DateOnly(rangeFrom.Year, rangeFrom.Month, 1);
        var monthEnd = new DateOnly(rangeTo.Year, rangeTo.Month, 1);
        var monthsCount = ((monthEnd.Year - monthStart.Year) * 12) + monthEnd.Month - monthStart.Month + 1;

        return Enumerable.Range(0, monthsCount)
            .Select(offset => monthStart.AddMonths(offset))
            .Select(periodStart =>
            {
                var periodEnd = periodStart.AddMonths(1);
                var startUtc = periodStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
                var endUtc = periodEnd.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
                var scopedOrders = paidOrders
                    .Where(order => order.CreatedAtUtc >= startUtc && order.CreatedAtUtc < endUtc)
                    .Where(order => IsWithinRange(order.CreatedAtUtc, rangeFrom, rangeTo))
                    .ToArray();

                return new TrendPointDto
                {
                    Label = periodStart.ToString("MM.yyyy"),
                    PeriodStartUtc = new DateTimeOffset(startUtc, TimeSpan.Zero),
                    OrdersCount = scopedOrders.Length,
                    Revenue = scopedOrders.Sum(order => order.TotalAmount),
                };
            })
            .ToArray();
    }

    private static IReadOnlyCollection<StatusMetricDto> BuildOrderStatuses(IEnumerable<Order> orders)
    {
        return orders
            .GroupBy(order => order.Status)
            .Select(group => new StatusMetricDto
            {
                Label = group.Key,
                Count = group.Count(),
            })
            .OrderByDescending(metric => metric.Count)
            .ToArray();
    }

    private static IReadOnlyCollection<StatusMetricDto> BuildDeliveryStatuses(IEnumerable<Order> orders)
    {
        return orders
            .Select(order => order.Delivery?.Status)
            .Where(status => !string.IsNullOrWhiteSpace(status))
            .Cast<string>()
            .GroupBy(status => status)
            .Select(group => new StatusMetricDto
            {
                Label = group.Key,
                Count = group.Count(),
            })
            .OrderByDescending(metric => metric.Count)
            .ToArray();
    }

    private static IReadOnlyCollection<StatusMetricDto> BuildPaymentStatuses(IEnumerable<Order> orders)
    {
        return orders
            .Select(order => order.Payment?.Status)
            .Where(status => !string.IsNullOrWhiteSpace(status))
            .Cast<string>()
            .GroupBy(status => status)
            .Select(group => new StatusMetricDto
            {
                Label = group.Key,
                Count = group.Count(),
            })
            .OrderByDescending(metric => metric.Count)
            .ToArray();
    }

    private static IReadOnlyCollection<StatusMetricDto> BuildDeliveryMethods(IEnumerable<Order> orders)
    {
        return orders
            .GroupBy(order => order.DeliveryMethod)
            .Select(group => new StatusMetricDto
            {
                Label = group.Key == DeliveryMethod.Pickup ? "Самовывоз" : "Доставка",
                Count = group.Count(),
            })
            .OrderByDescending(metric => metric.Count)
            .ToArray();
    }

    private static IReadOnlyCollection<ProductTypeAnalyticsDto> BuildProductTypeAnalytics(IEnumerable<Order> orders)
    {
        return orders
            .SelectMany(order => order.Items.Select(item => new
            {
                order.Id,
                item.ProductType,
                item.Quantity,
                Revenue = item.UnitPrice * item.Quantity,
            }))
            .GroupBy(item => item.ProductType)
            .Select(group => new ProductTypeAnalyticsDto
            {
                ProductType = group.Key,
                ItemsSold = group.Sum(item => item.Quantity),
                OrdersCount = group.Select(item => item.Id).Distinct().Count(),
                Revenue = group.Sum(item => item.Revenue),
            })
            .OrderByDescending(metric => metric.Revenue)
            .ToArray();
    }

    private static IReadOnlyCollection<TopProductAnalyticsDto> BuildTopProducts(IEnumerable<Order> orders)
    {
        return orders
            .SelectMany(order => order.Items.Select(item => new
            {
                OrderId = order.Id,
                ProductId = item.ProductId,
                item.ProductType,
                item.ProductName,
                item.Quantity,
                Revenue = item.UnitPrice * item.Quantity,
            }))
            .GroupBy(item => new { item.ProductId, item.ProductType, item.ProductName })
            .Select(group => new TopProductAnalyticsDto
            {
                ProductId = group.Key.ProductId,
                ProductType = group.Key.ProductType,
                ProductName = group.Key.ProductName,
                QuantitySold = group.Sum(item => item.Quantity),
                OrdersCount = group.Select(item => item.OrderId).Distinct().Count(),
                Revenue = group.Sum(item => item.Revenue),
            })
            .OrderByDescending(metric => metric.QuantitySold)
            .ThenByDescending(metric => metric.Revenue)
            .Take(12)
            .ToArray();
    }

    private static IReadOnlyCollection<EmployeePerformanceDto> BuildFloristPerformance(
        IEnumerable<Order> orders,
        IReadOnlyDictionary<string, UserDirectoryDto> userDirectory)
    {
        return orders
            .Where(order => !string.IsNullOrWhiteSpace(order.FloristId))
            .GroupBy(order => order.FloristId!)
            .Select(group =>
            {
                userDirectory.TryGetValue(group.Key, out var user);
                var assignedOrders = group.ToArray();
                var completedOrders = assignedOrders.Count(order => order.Status == OrderStatusCodes.Completed);
                var cancelledOrders = assignedOrders.Count(order => order.Status == OrderStatusCodes.Cancelled);
                var activeOrders = assignedOrders.Count(order => order.Status == OrderStatusCodes.Active);
                var paidRevenue = assignedOrders
                    .Where(IsPaidOrder)
                    .Sum(order => order.TotalAmount);

                return new EmployeePerformanceDto
                {
                    EmployeeId = group.Key,
                    FullName = user?.FullName ?? "Неизвестный флорист",
                    Email = user?.Email ?? string.Empty,
                    TotalAssignedOrders = assignedOrders.Length,
                    ActiveOrders = activeOrders,
                    CompletedOrders = completedOrders,
                    CancelledOrders = cancelledOrders,
                    RevenueHandled = paidRevenue,
                    CompletionRatePercent = assignedOrders.Length == 0
                        ? 0
                        : Math.Round((decimal)completedOrders / assignedOrders.Length * 100, 1),
                };
            })
            .OrderByDescending(metric => metric.CompletedOrders)
            .ThenByDescending(metric => metric.RevenueHandled)
            .ToArray();
    }

    private static IReadOnlyCollection<EmployeePerformanceDto> BuildCourierPerformance(
        IEnumerable<Order> orders,
        IReadOnlyDictionary<string, UserDirectoryDto> userDirectory)
    {
        return orders
            .Where(order => !string.IsNullOrWhiteSpace(order.Delivery?.CourierId))
            .GroupBy(order => order.Delivery!.CourierId!)
            .Select(group =>
            {
                userDirectory.TryGetValue(group.Key, out var user);
                var assignedOrders = group.ToArray();
                var completedOrders = assignedOrders.Count(order => order.Delivery?.Status == DeliveryStatusCodes.ReceivedByCustomer);
                var cancelledOrders = assignedOrders.Count(order => order.Status == OrderStatusCodes.Cancelled);
                var activeOrders = assignedOrders.Count(order => order.Status == OrderStatusCodes.Active);
                var paidRevenue = assignedOrders
                    .Where(IsPaidOrder)
                    .Sum(order => order.TotalAmount);

                return new EmployeePerformanceDto
                {
                    EmployeeId = group.Key,
                    FullName = user?.FullName ?? "Неизвестный курьер",
                    Email = user?.Email ?? string.Empty,
                    TotalAssignedOrders = assignedOrders.Length,
                    ActiveOrders = activeOrders,
                    CompletedOrders = completedOrders,
                    CancelledOrders = cancelledOrders,
                    RevenueHandled = paidRevenue,
                    CompletionRatePercent = assignedOrders.Length == 0
                        ? 0
                        : Math.Round((decimal)completedOrders / assignedOrders.Length * 100, 1),
                };
            })
            .OrderByDescending(metric => metric.CompletedOrders)
            .ThenByDescending(metric => metric.RevenueHandled)
            .ToArray();
    }

    private static bool IsWithinRange(DateTime utcDateTime, DateOnly? from, DateOnly? to)
    {
        var date = DateOnly.FromDateTime(utcDateTime);
        return (!from.HasValue || date >= from.Value) && (!to.HasValue || date <= to.Value);
    }

    private static bool IsPaidOrder(Order order)
    {
        return order.Payment?.Status == PaymentStatusCodes.Paid;
    }
}
