using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly FlowoffDbContext _dbContext;

    public ProductRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Product product, CancellationToken cancellationToken)
    {
        switch (product)
        {
            case Bouquet bouquet:
                await _dbContext.Bouquets.AddAsync(bouquet, cancellationToken);
                break;
            case Flower flower:
                await _dbContext.Flowers.AddAsync(flower, cancellationToken);
                break;
            case Gift gift:
                await _dbContext.Gifts.AddAsync(gift, cancellationToken);
                break;
            default:
                throw new InvalidOperationException("Unsupported product type.");
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<Product>> GetAllAsync(
        ProductType? type,
        Guid? categoryId,
        Guid? colorId,
        Guid? flowerInId,
        CancellationToken cancellationToken)
    {
        var results = new List<Product>();

        if (!type.HasValue || type == ProductType.Bouquet)
        {
            var bouquetsQuery = _dbContext.Bouquets
                .AsNoTracking()
                .Include(bouquet => bouquet.FlowerIns)
                .ThenInclude(item => item.FlowerIn)
                .Include(bouquet => bouquet.Colors)
                .ThenInclude(item => item.Color)
                .Where(bouquet => !bouquet.IsDeleted && bouquet.IsVisible);

            if (colorId.HasValue)
            {
                bouquetsQuery = bouquetsQuery.Where(bouquet => bouquet.Colors.Any(item => item.ColorId == colorId.Value));
            }

            if (flowerInId.HasValue)
            {
                bouquetsQuery = bouquetsQuery.Where(bouquet => bouquet.FlowerIns.Any(item => item.FlowerInId == flowerInId.Value));
            }

            results.AddRange(await bouquetsQuery.ToArrayAsync(cancellationToken));
        }

        if (!type.HasValue || type == ProductType.Flower)
        {
            var flowersQuery = _dbContext.Flowers
                .AsNoTracking()
                .Include(flower => flower.FlowerIn)
                .Include(flower => flower.Color)
                .Where(flower => !flower.IsDeleted && flower.IsVisible);

            if (colorId.HasValue)
            {
                flowersQuery = flowersQuery.Where(flower => flower.ColorId == colorId.Value);
            }

            if (flowerInId.HasValue)
            {
                flowersQuery = flowersQuery.Where(flower => flower.FlowerInId == flowerInId.Value);
            }

            results.AddRange(await flowersQuery.ToArrayAsync(cancellationToken));
        }

        if (!type.HasValue || type == ProductType.Gift)
        {
            var giftsQuery = _dbContext.Gifts
                .AsNoTracking()
                .Include(gift => gift.Category)
                .Where(gift => !gift.IsDeleted && gift.IsVisible);

            if (categoryId.HasValue)
            {
                giftsQuery = giftsQuery.Where(gift => gift.CategoryId == categoryId.Value);
            }

            results.AddRange(await giftsQuery.ToArrayAsync(cancellationToken));
        }

        return results.OrderBy(product => product.Name).ToArray();
    }

    public async Task<Product?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken,
        bool includeHidden = false,
        bool asTracking = true)
    {
        var allowHidden = includeHidden;
        var bouquetsQuery = _dbContext.Bouquets.AsQueryable();
        var flowersQuery = _dbContext.Flowers.AsQueryable();
        var giftsQuery = _dbContext.Gifts.AsQueryable();

        if (!asTracking)
        {
            bouquetsQuery = bouquetsQuery.AsNoTracking();
            flowersQuery = flowersQuery.AsNoTracking();
            giftsQuery = giftsQuery.AsNoTracking();
        }

        Product? product = await bouquetsQuery
            .Include(bouquet => bouquet.FlowerIns)
            .ThenInclude(item => item.FlowerIn)
            .Include(bouquet => bouquet.Colors)
            .ThenInclude(item => item.Color)
            .FirstOrDefaultAsync(
                bouquet => bouquet.Id == id && !bouquet.IsDeleted && (allowHidden || bouquet.IsVisible),
                cancellationToken);

        if (product is not null)
        {
            return product;
        }

        product = await flowersQuery
            .Include(flower => flower.FlowerIn)
            .Include(flower => flower.Color)
            .FirstOrDefaultAsync(
                flower => flower.Id == id && !flower.IsDeleted && (allowHidden || flower.IsVisible),
                cancellationToken);

        if (product is not null)
        {
            return product;
        }

        return await giftsQuery
            .Include(gift => gift.Category)
            .FirstOrDefaultAsync(
                gift => gift.Id == id && !gift.IsDeleted && (allowHidden || gift.IsVisible),
                cancellationToken);
    }

    public Task<bool> CategoryExistsAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        return _dbContext.Categories.AnyAsync(category => category.Id == categoryId && !category.IsDeleted, cancellationToken);
    }

    public Task<bool> ColorExistsAsync(Guid colorId, CancellationToken cancellationToken)
    {
        return _dbContext.Colors.AnyAsync(color => color.Id == colorId && !color.IsDeleted, cancellationToken);
    }

    public Task<bool> FlowerInExistsAsync(Guid flowerInId, CancellationToken cancellationToken)
    {
        return _dbContext.FlowerIns.AnyAsync(flowerIn => flowerIn.Id == flowerInId && !flowerIn.IsDeleted, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
