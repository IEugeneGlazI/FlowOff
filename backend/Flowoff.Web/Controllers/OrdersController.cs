using Flowoff.Application.DTOs.Orders;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Customer))]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(IReadOnlyCollection<OrderDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<OrderDto>>> GetMyOrders(CancellationToken cancellationToken)
    {
        return Ok(await _orderService.GetMyOrdersAsync(cancellationToken));
    }

    [HttpPost]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderRequestDto request, CancellationToken cancellationToken)
    {
        var order = await _orderService.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, order);
    }
}
