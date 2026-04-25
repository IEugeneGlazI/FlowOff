using Flowoff.Application.DTOs.Cart;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Customer))]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CartDto>> Get(CancellationToken cancellationToken)
    {
        return Ok(await _cartService.GetMyCartAsync(cancellationToken));
    }

    [HttpPost("items")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CartDto>> AddItem(AddCartItemRequestDto request, CancellationToken cancellationToken)
    {
        return Ok(await _cartService.AddItemAsync(request, cancellationToken));
    }

    [HttpPut("items")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CartDto>> UpdateItem(UpdateCartItemRequestDto request, CancellationToken cancellationToken)
    {
        return Ok(await _cartService.UpdateItemAsync(request, cancellationToken));
    }

    [HttpDelete("items/{productId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveItem(Guid productId, CancellationToken cancellationToken)
    {
        await _cartService.RemoveItemAsync(productId, cancellationToken);
        return NoContent();
    }

    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Clear(CancellationToken cancellationToken)
    {
        await _cartService.ClearAsync(cancellationToken);
        return NoContent();
    }
}
