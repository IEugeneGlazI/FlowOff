using Flowoff.Application.DTOs.Products;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;

    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequestDto request, CancellationToken cancellationToken)
    {
        var product = await BuildProductAsync(request, cancellationToken);
        await _productRepository.AddAsync(product, cancellationToken);
        return Map(product);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(id, cancellationToken, includeHidden: true)
            ?? throw new InvalidOperationException("Product not found.");

        product.SoftDelete();
        await _productRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(id, cancellationToken);
        return product is null ? null : Map(product);
    }

    public async Task<IReadOnlyCollection<ProductDto>> GetCatalogAsync(ProductFilterDto filter, CancellationToken cancellationToken, bool includeHidden = false)
    {
        var products = await _productRepository.GetAllAsync(
            filter.Type,
            filter.CategoryId,
            filter.ColorId,
            filter.FlowerInId,
            includeHidden,
            cancellationToken);

        return products.Select(Map).ToArray();
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequestDto request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(id, cancellationToken, includeHidden: true)
            ?? throw new InvalidOperationException("Product not found.");

        switch (product)
        {
            case Bouquet bouquet:
                await EnsureFlowerInsExistAsync(request.FlowerInIds, cancellationToken);
                await EnsureColorsExistAsync(request.ColorIds, cancellationToken);
                bouquet.UpdateDetails(
                    request.Name,
                    request.Description,
                    request.Price,
                    request.FlowerInIds,
                    request.ColorIds);
                break;
            case Flower flower:
                var flowerInId = request.FlowerInId
                    ?? throw new InvalidOperationException("Flower type is required for flower.");
                var colorId = request.ColorId
                    ?? throw new InvalidOperationException("Color is required for flower.");
                await EnsureFlowerInExistsAsync(flowerInId, cancellationToken);
                await EnsureColorExistsAsync(colorId, cancellationToken);
                flower.UpdateDetails(
                    request.Name,
                    request.Description,
                    request.Price,
                    flowerInId,
                    colorId);
                break;
            case Gift gift:
                var categoryId = request.CategoryId
                    ?? throw new InvalidOperationException("Category is required for gift.");
                await EnsureCategoryExistsAsync(categoryId, cancellationToken);
                gift.UpdateDetails(
                    request.Name,
                    request.Description,
                    request.Price,
                    categoryId);
                break;
            default:
                throw new InvalidOperationException("Unsupported product type.");
        }

        product.SetVisibility(request.IsVisible);
        await _productRepository.SaveChangesAsync(cancellationToken);
        return Map(product);
    }

    private async Task<Product> BuildProductAsync(CreateProductRequestDto request, CancellationToken cancellationToken)
    {
        return request.Type switch
        {
            Domain.Enums.ProductType.Bouquet => await BuildBouquetAsync(request, cancellationToken),
            Domain.Enums.ProductType.Flower => await BuildFlowerAsync(request, cancellationToken),
            Domain.Enums.ProductType.Gift => await BuildGiftAsync(request, cancellationToken),
            _ => throw new InvalidOperationException("Unsupported product type.")
        };
    }

    private async Task<Product> BuildBouquetAsync(CreateProductRequestDto request, CancellationToken cancellationToken)
    {
        if (request.FlowerInIds.Count == 0)
        {
            throw new InvalidOperationException("Bouquet must contain at least one flower type.");
        }

        if (request.ColorIds.Count == 0)
        {
            throw new InvalidOperationException("Bouquet must contain at least one color.");
        }

        await EnsureFlowerInsExistAsync(request.FlowerInIds, cancellationToken);
        await EnsureColorsExistAsync(request.ColorIds, cancellationToken);

        return new Bouquet(
            request.Name,
            request.Description,
            request.Price,
            request.FlowerInIds,
            request.ColorIds,
            request.IsVisible);
    }

    private async Task<Product> BuildFlowerAsync(CreateProductRequestDto request, CancellationToken cancellationToken)
    {
        var flowerInId = request.FlowerInId
            ?? throw new InvalidOperationException("Flower type is required for flower.");
        var colorId = request.ColorId
            ?? throw new InvalidOperationException("Color is required for flower.");

        await EnsureFlowerInExistsAsync(flowerInId, cancellationToken);
        await EnsureColorExistsAsync(colorId, cancellationToken);

        return new Flower(
            request.Name,
            request.Description,
            request.Price,
            flowerInId,
            colorId,
            request.IsVisible);
    }

    private async Task<Product> BuildGiftAsync(CreateProductRequestDto request, CancellationToken cancellationToken)
    {
        var categoryId = request.CategoryId
            ?? throw new InvalidOperationException("Category is required for gift.");

        await EnsureCategoryExistsAsync(categoryId, cancellationToken);

        return new Gift(
            request.Name,
            request.Description,
            request.Price,
            categoryId,
            request.IsVisible);
    }

    private async Task EnsureCategoryExistsAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        if (!await _productRepository.CategoryExistsAsync(categoryId, cancellationToken))
        {
            throw new InvalidOperationException("Category not found.");
        }
    }

    private async Task EnsureColorExistsAsync(Guid colorId, CancellationToken cancellationToken)
    {
        if (!await _productRepository.ColorExistsAsync(colorId, cancellationToken))
        {
            throw new InvalidOperationException("Color not found.");
        }
    }

    private async Task EnsureFlowerInExistsAsync(Guid flowerInId, CancellationToken cancellationToken)
    {
        if (!await _productRepository.FlowerInExistsAsync(flowerInId, cancellationToken))
        {
            throw new InvalidOperationException("Flower type not found.");
        }
    }

    private async Task EnsureColorsExistAsync(IEnumerable<Guid> colorIds, CancellationToken cancellationToken)
    {
        foreach (var colorId in colorIds.Distinct())
        {
            await EnsureColorExistsAsync(colorId, cancellationToken);
        }
    }

    private async Task EnsureFlowerInsExistAsync(IEnumerable<Guid> flowerInIds, CancellationToken cancellationToken)
    {
        foreach (var flowerInId in flowerInIds.Distinct())
        {
            await EnsureFlowerInExistsAsync(flowerInId, cancellationToken);
        }
    }

    private static ProductDto Map(Product product)
    {
        return product switch
        {
            Bouquet bouquet => new ProductDto
            {
                Id = bouquet.Id,
                Name = bouquet.Name,
                Description = bouquet.Description,
                Price = bouquet.Price,
                IsVisible = bouquet.IsVisible,
                Type = bouquet.Type.ToString(),
                FlowerInIds = bouquet.FlowerIns.Select(item => item.FlowerInId).ToArray(),
                FlowerInNames = bouquet.FlowerIns.Select(item => item.FlowerIn?.Name ?? string.Empty).ToArray(),
                ColorIds = bouquet.Colors.Select(item => item.ColorId).ToArray(),
                ColorNames = bouquet.Colors.Select(item => item.Color?.Name ?? string.Empty).ToArray()
            },
            Flower flower => new ProductDto
            {
                Id = flower.Id,
                Name = flower.Name,
                Description = flower.Description,
                Price = flower.Price,
                IsVisible = flower.IsVisible,
                Type = flower.Type.ToString(),
                FlowerInId = flower.FlowerInId,
                FlowerInName = flower.FlowerIn?.Name,
                ColorId = flower.ColorId,
                ColorName = flower.Color?.Name,
                FlowerInIds = [flower.FlowerInId],
                FlowerInNames = flower.FlowerIn is null ? [] : [flower.FlowerIn.Name],
                ColorIds = [flower.ColorId],
                ColorNames = flower.Color is null ? [] : [flower.Color.Name]
            },
            Gift gift => new ProductDto
            {
                Id = gift.Id,
                Name = gift.Name,
                Description = gift.Description,
                Price = gift.Price,
                IsVisible = gift.IsVisible,
                Type = gift.Type.ToString(),
                CategoryId = gift.CategoryId,
                CategoryName = gift.Category?.Name
            },
            _ => throw new InvalidOperationException("Unsupported product type.")
        };
    }
}
