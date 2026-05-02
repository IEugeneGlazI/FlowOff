using Flowoff.Application.DTOs.References;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;

namespace Flowoff.Application.Services;

public class ReferenceDataService : IReferenceDataService
{
    public Task<IReadOnlyCollection<StatusReferenceItemDto>> GetStatusesAsync(CancellationToken cancellationToken)
    {
        var result = new List<StatusReferenceItemDto>();

        result.AddRange(Build<OrderStatus>("order"));
        result.AddRange(Build<PaymentStatus>("payment"));
        result.AddRange(Build<SupportRequestStatus>("support"));

        result.AddRange(new[]
        {
            new StatusReferenceItemDto { Group = "assembly", Key = OrderStatus.Accepted.ToString() },
            new StatusReferenceItemDto { Group = "assembly", Key = OrderStatus.InAssembly.ToString() },
            new StatusReferenceItemDto { Group = "assembly", Key = OrderStatus.Assembled.ToString() },
            new StatusReferenceItemDto { Group = "assembly", Key = OrderStatus.TransferredToCourier.ToString() },
            new StatusReferenceItemDto { Group = "delivery", Key = OrderStatus.InTransit.ToString() },
            new StatusReferenceItemDto { Group = "delivery", Key = OrderStatus.Delivered.ToString() }
        });

        return Task.FromResult<IReadOnlyCollection<StatusReferenceItemDto>>(result);
    }

    private static IEnumerable<StatusReferenceItemDto> Build<TEnum>(string group)
        where TEnum : struct, Enum
    {
        return Enum.GetNames<TEnum>().Select(name => new StatusReferenceItemDto
        {
            Group = group,
            Key = name
        });
    }
}
