using Flowoff.Application.DTOs.Orders;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Administrator))]
[Route("api/admin/orders")]
public class AdminOrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public AdminOrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<OrderDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<OrderDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _orderService.GetAllAsync(cancellationToken));
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OrderDto>> UpdateStatus(
        Guid id,
        UpdateOrderStatusByAdminRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _orderService.UpdateStatusByAdminAsync(id, request, cancellationToken));
    }

    [HttpPatch("{id:guid}/cancel")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OrderDto>> Cancel(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _orderService.CancelByAdminAsync(id, cancellationToken));
    }
}
