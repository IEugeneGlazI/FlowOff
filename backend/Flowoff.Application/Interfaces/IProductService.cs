using Flowoff.Application.DTOs.Products;

namespace Flowoff.Application.Interfaces;

public interface IProductService
{
    Task<IReadOnlyCollection<ProductDto>> GetCatalogAsync(ProductFilterDto filter, CancellationToken cancellationToken);
    Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<ProductDto> CreateAsync(CreateProductRequestDto request, CancellationToken cancellationToken);
    Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequestDto request, CancellationToken cancellationToken);
    Task<ProductDto> UpdateStockAsync(Guid id, UpdateProductStockRequestDto request, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken);
}
