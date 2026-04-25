using Flowoff.Application.DTOs.Promotions;

namespace Flowoff.Application.Interfaces;

public interface IPromotionService
{
    Task<IReadOnlyCollection<PromotionDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<PromotionDto> CreateAsync(CreatePromotionRequestDto request, CancellationToken cancellationToken);
    Task<PromotionDto> UpdateAsync(Guid id, UpdatePromotionRequestDto request, CancellationToken cancellationToken);
}
