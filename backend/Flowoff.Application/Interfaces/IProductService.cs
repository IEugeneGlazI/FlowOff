using Flowoff.Application.DTOs.Products;

namespace Flowoff.Application.Interfaces;

public interface IProductService
{
    Task<IReadOnlyCollection<ProductDto>> GetCatalogAsync(ProductFilterDto filter, CancellationToken cancellationToken);
    Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<ProductDto> CreateAsync(CreateProductRequestDto request, CancellationToken cancellationToken);
}
