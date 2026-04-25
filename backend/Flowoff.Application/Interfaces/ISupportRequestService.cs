using Flowoff.Application.DTOs.Support;

namespace Flowoff.Application.Interfaces;

public interface ISupportRequestService
{
    Task<SupportRequestDto> CreateAsync(CreateSupportRequestDto request, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<SupportRequestDto>> GetMyAsync(CancellationToken cancellationToken);
    Task<IReadOnlyCollection<SupportRequestDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<SupportRequestDto> UpdateStatusAsync(Guid id, UpdateSupportRequestStatusDto request, CancellationToken cancellationToken);
}
