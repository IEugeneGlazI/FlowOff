using Flowoff.Application.DTOs.References;

namespace Flowoff.Application.Interfaces;

public interface IReferenceDataService
{
    Task<IReadOnlyCollection<StatusReferenceItemDto>> GetStatusesAsync(CancellationToken cancellationToken);
}
