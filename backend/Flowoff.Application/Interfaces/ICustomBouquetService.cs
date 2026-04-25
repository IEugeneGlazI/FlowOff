using Flowoff.Application.DTOs.CustomBouquets;

namespace Flowoff.Application.Interfaces;

public interface ICustomBouquetService
{
    Task<CustomBouquetCalculationDto> CalculateAsync(IReadOnlyCollection<CustomBouquetItemRequestDto> items, CancellationToken cancellationToken);
    Task<CustomBouquetDto> CreateAsync(CreateCustomBouquetRequestDto request, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<CustomBouquetDto>> GetMyAsync(CancellationToken cancellationToken);
}
