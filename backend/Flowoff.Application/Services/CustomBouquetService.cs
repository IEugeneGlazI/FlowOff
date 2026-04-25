using Flowoff.Application.DTOs.CustomBouquets;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class CustomBouquetService : ICustomBouquetService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly ICustomBouquetRepository _customBouquetRepository;
    private readonly IProductRepository _productRepository;

    public CustomBouquetService(
        ICustomBouquetRepository customBouquetRepository,
        IProductRepository productRepository,
        ICurrentUserService currentUserService)
    {
        _customBouquetRepository = customBouquetRepository;
        _productRepository = productRepository;
        _currentUserService = currentUserService;
    }

    public async Task<CustomBouquetCalculationDto> CalculateAsync(
        IReadOnlyCollection<CustomBouquetItemRequestDto> items,
        CancellationToken cancellationToken)
    {
        var mappedItems = await BuildItemsAsync(items, cancellationToken);
        return new CustomBouquetCalculationDto
        {
            TotalPrice = mappedItems.Sum(item => item.LineTotal),
            Items = mappedItems
        };
    }

    public async Task<CustomBouquetDto> CreateAsync(CreateCustomBouquetRequestDto request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            throw new InvalidOperationException("Authenticated user is required.");
        }

        var items = await BuildItemsAsync(request.Items, cancellationToken);
        var customBouquetItems = items
            .Select(item => new CustomBouquetItem(item.ProductId, item.Quantity, item.UnitPrice))
            .ToArray();

        var bouquet = new CustomBouquet(
            _currentUserService.UserId,
            request.Name,
            items.Sum(item => item.LineTotal),
            customBouquetItems);

        await _customBouquetRepository.AddAsync(bouquet, cancellationToken);

        return new CustomBouquetDto
        {
            Id = bouquet.Id,
            Name = bouquet.Name,
            TotalPrice = bouquet.TotalPrice,
            Items = items
        };
    }

    public async Task<IReadOnlyCollection<CustomBouquetDto>> GetMyAsync(CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            return [];
        }

        var bouquets = await _customBouquetRepository.GetByCustomerIdAsync(_currentUserService.UserId, cancellationToken);
        return bouquets.Select(Map).ToArray();
    }

    private async Task<IReadOnlyCollection<CustomBouquetItemDto>> BuildItemsAsync(
        IReadOnlyCollection<CustomBouquetItemRequestDto> items,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0)
        {
            throw new InvalidOperationException("At least one flower is required.");
        }

        var result = new List<CustomBouquetItemDto>();

        foreach (var item in items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken)
                ?? throw new InvalidOperationException($"Product {item.ProductId} not found.");

            if (product.Type != ProductType.Flower)
            {
                throw new InvalidOperationException("Only single flowers can be used in custom bouquet constructor.");
            }

            result.Add(new CustomBouquetItemDto
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = item.Quantity,
                LineTotal = product.Price * item.Quantity
            });
        }

        return result;
    }

    private static CustomBouquetDto Map(CustomBouquet bouquet) =>
        new()
        {
            Id = bouquet.Id,
            Name = bouquet.Name,
            TotalPrice = bouquet.TotalPrice,
            Items = bouquet.Items.Select(item => new CustomBouquetItemDto
            {
                ProductId = item.ProductId,
                ProductName = item.Product?.Name ?? string.Empty,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                LineTotal = item.UnitPrice * item.Quantity
            }).ToArray()
        };
}
