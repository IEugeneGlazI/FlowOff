using Flowoff.Application.DTOs.Cart;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IProductRepository _productRepository;

    public CartService(
        ICartRepository cartRepository,
        IProductRepository productRepository,
        ICurrentUserService currentUserService)
    {
        _cartRepository = cartRepository;
        _productRepository = productRepository;
        _currentUserService = currentUserService;
    }

    public async Task<CartDto> AddItemAsync(AddCartItemRequestDto request, CancellationToken cancellationToken)
    {
        var customerId = GetRequiredCustomerId();
        var product = await _productRepository.GetByIdAsync(
            request.ProductId,
            cancellationToken,
            asTracking: false)
            ?? throw new InvalidOperationException("Product not found.");

        var cart = await _cartRepository.AddItemAsync(customerId, product, request.Quantity, cancellationToken);

        return await MapAsync(cart, cancellationToken);
    }

    public async Task ClearAsync(CancellationToken cancellationToken)
    {
        var cart = await _cartRepository.GetOrCreateAsync(GetRequiredCustomerId(), cancellationToken);
        cart.Clear();
        await _cartRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<CartDto> GetMyCartAsync(CancellationToken cancellationToken)
    {
        var customerId = GetRequiredCustomerId();
        var cart = await _cartRepository.GetByCustomerIdAsync(customerId, cancellationToken);

        if (cart is null)
        {
            return new CartDto
            {
                Id = Guid.Empty,
                CustomerId = customerId,
                TotalAmount = 0,
                Items = []
            };
        }

        return await MapAsync(cart, cancellationToken);
    }

    public async Task RemoveItemAsync(Guid productId, CancellationToken cancellationToken)
    {
        var cart = await _cartRepository.GetOrCreateAsync(GetRequiredCustomerId(), cancellationToken);
        cart.RemoveItem(productId);
        await _cartRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<CartDto> UpdateItemAsync(UpdateCartItemRequestDto request, CancellationToken cancellationToken)
    {
        var cart = await _cartRepository.GetOrCreateAsync(GetRequiredCustomerId(), cancellationToken);
        cart.UpdateItemQuantity(request.ProductId, request.Quantity);
        await _cartRepository.SaveChangesAsync(cancellationToken);

        return await MapAsync(cart, cancellationToken);
    }

    private string GetRequiredCustomerId()
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            throw new InvalidOperationException("Authenticated user is required.");
        }

        return _currentUserService.UserId;
    }

    private async Task<CartDto> MapAsync(Domain.Entities.Cart cart, CancellationToken cancellationToken)
    {
        var items = new List<CartItemDto>();

        foreach (var item in cart.Items)
        {
            var product = await _productRepository.GetByIdAsync(
                item.ProductId,
                cancellationToken,
                includeHidden: true,
                asTracking: false);
            if (product is null)
            {
                continue;
            }

            items.Add(new CartItemDto
            {
                ProductId = item.ProductId,
                ProductType = product.Type.ToString(),
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = item.Quantity,
                LineTotal = product.Price * item.Quantity
            });
        }

        return new CartDto
        {
            Id = cart.Id,
            CustomerId = cart.CustomerId,
            TotalAmount = items.Sum(item => item.LineTotal),
            Items = items
        };
    }
}
