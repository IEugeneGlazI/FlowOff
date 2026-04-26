using Flowoff.Application.DTOs.Products;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class ProductService : IProductService
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IProductRepository _productRepository;

    public ProductService(IProductRepository productRepository, ICategoryRepository categoryRepository)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequestDto request, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken);
        if (category is null)
        {
            throw new InvalidOperationException("Category not found.");
        }

        var product = new Product(
            request.Name,
            request.Description,
            request.Price,
            request.StockQuantity,
            request.Type,
            request.CategoryId,
            request.IsShowcase);

        await _productRepository.AddAsync(product, cancellationToken);
        return Map(product, category.Name);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Product not found.");

        product.SoftDelete();
        await _productRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(id, cancellationToken);
        return product is null ? null : Map(product, product.Category?.Name);
    }

    public async Task<IReadOnlyCollection<ProductDto>> GetCatalogAsync(ProductFilterDto filter, CancellationToken cancellationToken)
    {
        var products = await _productRepository.GetAllAsync(filter.Type, filter.CategoryId, cancellationToken);
        return products.Select(product => Map(product, product.Category?.Name)).ToArray();
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequestDto request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Product not found.");

        product.UpdateDetails(
            request.Name,
            request.Description,
            request.Price,
            request.StockQuantity,
            request.IsShowcase);

        await _productRepository.SaveChangesAsync(cancellationToken);
        return Map(product, product.Category?.Name);
    }

    public async Task<ProductDto> UpdateStockAsync(Guid id, UpdateProductStockRequestDto request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Product not found.");

        product.SetStockQuantity(request.StockQuantity);
        await _productRepository.SaveChangesAsync(cancellationToken);
        return Map(product, product.Category?.Name);
    }

    private static ProductDto Map(Product product, string? categoryName) =>
        new()
        {
            Id = product.Id,
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            StockQuantity = product.StockQuantity,
            Type = product.Type.ToString(),
            IsShowcase = product.IsShowcase,
            CategoryId = product.CategoryId,
            CategoryName = categoryName
        };
}
