using Flowoff.Application.DTOs.Promotions;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class PromotionService : IPromotionService
{
    private readonly IProductRepository _productRepository;
    private readonly IPromotionRepository _promotionRepository;

    public PromotionService(IPromotionRepository promotionRepository, IProductRepository productRepository)
    {
        _promotionRepository = promotionRepository;
        _productRepository = productRepository;
    }

    public async Task<PromotionDto> CreateAsync(CreatePromotionRequestDto request, CancellationToken cancellationToken)
    {
        await EnsureTargetsExistAsync(request.BouquetIds, request.FlowerIds, request.GiftIds, cancellationToken);

        var promotion = new Promotion(
            request.Title,
            request.Description,
            request.DiscountPercent,
            request.StartsAtUtc,
            request.EndsAtUtc,
            request.BouquetIds,
            request.FlowerIds,
            request.GiftIds);

        await _promotionRepository.AddAsync(promotion, cancellationToken);
        return Map(promotion);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var promotion = await _promotionRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Promotion not found.");

        promotion.SoftDelete();
        await _promotionRepository.SaveChangesAsync(cancellationToken);
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

        await EnsureTargetsExistAsync(request.BouquetIds, request.FlowerIds, request.GiftIds, cancellationToken);

        promotion.Update(
            request.Title,
            request.Description,
            request.DiscountPercent,
            request.StartsAtUtc,
            request.EndsAtUtc,
            request.IsActive,
            request.BouquetIds,
            request.FlowerIds,
            request.GiftIds);

        await _promotionRepository.SaveChangesAsync(cancellationToken);
        return Map(promotion);
    }

    private async Task EnsureTargetsExistAsync(
        IEnumerable<Guid> bouquetIds,
        IEnumerable<Guid> flowerIds,
        IEnumerable<Guid> giftIds,
        CancellationToken cancellationToken)
    {
        foreach (var bouquetId in bouquetIds.Distinct())
        {
            var product = await _productRepository.GetByIdAsync(bouquetId, cancellationToken, includeHidden: true);
            if (product is not Bouquet)
            {
                throw new InvalidOperationException($"Bouquet {bouquetId} not found.");
            }
        }

        foreach (var flowerId in flowerIds.Distinct())
        {
            var product = await _productRepository.GetByIdAsync(flowerId, cancellationToken, includeHidden: true);
            if (product is not Flower)
            {
                throw new InvalidOperationException($"Flower {flowerId} not found.");
            }
        }

        foreach (var giftId in giftIds.Distinct())
        {
            var product = await _productRepository.GetByIdAsync(giftId, cancellationToken, includeHidden: true);
            if (product is not Gift)
            {
                throw new InvalidOperationException($"Gift {giftId} not found.");
            }
        }
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
            IsActive = promotion.IsActive,
            BouquetIds = promotion.Bouquets.Select(item => item.BouquetId).ToArray(),
            FlowerIds = promotion.Flowers.Select(item => item.FlowerId).ToArray(),
            GiftIds = promotion.Gifts.Select(item => item.GiftId).ToArray()
        };
}
