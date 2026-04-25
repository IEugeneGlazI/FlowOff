using Flowoff.Application.DTOs.Promotions;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class PromotionService : IPromotionService
{
    private readonly IPromotionRepository _promotionRepository;

    public PromotionService(IPromotionRepository promotionRepository)
    {
        _promotionRepository = promotionRepository;
    }

    public async Task<PromotionDto> CreateAsync(CreatePromotionRequestDto request, CancellationToken cancellationToken)
    {
        if (request.StartsAtUtc >= request.EndsAtUtc)
        {
            throw new InvalidOperationException("Promotion end time must be later than start time.");
        }

        var promotion = new Promotion(
            request.Title,
            request.Description,
            request.DiscountPercent,
            request.StartsAtUtc,
            request.EndsAtUtc);

        await _promotionRepository.AddAsync(promotion, cancellationToken);
        return Map(promotion);
    }

    public async Task<IReadOnlyCollection<PromotionDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var promotions = await _promotionRepository.GetAllAsync(cancellationToken);
        return promotions.Select(Map).ToArray();
    }

    public async Task<PromotionDto> UpdateAsync(Guid id, UpdatePromotionRequestDto request, CancellationToken cancellationToken)
    {
        var promotion = await _promotionRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Promotion not found.");

        promotion.Update(
            request.Title,
            request.Description,
            request.DiscountPercent,
            request.StartsAtUtc,
            request.EndsAtUtc,
            request.IsActive);

        await _promotionRepository.SaveChangesAsync(cancellationToken);
        return Map(promotion);
    }

    private static PromotionDto Map(Promotion promotion) =>
        new()
        {
            Id = promotion.Id,
            Title = promotion.Title,
            Description = promotion.Description,
            DiscountPercent = promotion.DiscountPercent,
            StartsAtUtc = promotion.StartsAtUtc,
            EndsAtUtc = promotion.EndsAtUtc,
            IsActive = promotion.IsActive
        };
}
