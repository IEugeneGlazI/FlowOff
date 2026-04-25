using Flowoff.Application.DTOs.Cart;

namespace Flowoff.Application.Interfaces;

public interface ICartService
{
    Task<CartDto> GetMyCartAsync(CancellationToken cancellationToken);
    Task<CartDto> AddItemAsync(AddCartItemRequestDto request, CancellationToken cancellationToken);
    Task<CartDto> UpdateItemAsync(UpdateCartItemRequestDto request, CancellationToken cancellationToken);
    Task ClearAsync(CancellationToken cancellationToken);
    Task RemoveItemAsync(Guid productId, CancellationToken cancellationToken);
}
