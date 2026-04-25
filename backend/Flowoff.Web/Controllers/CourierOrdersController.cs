using Flowoff.Application.DTOs.Orders;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Courier))]
[Route("api/courier/orders")]
public class CourierOrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public CourierOrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<OrderDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<OrderDto>>> GetAssigned(CancellationToken cancellationToken)
    {
        return Ok(await _orderService.GetAssignedToCourierAsync(cancellationToken));
    }

    [HttpPatch("{id:guid}/delivery-status")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OrderDto>> UpdateDeliveryStatus(
        Guid id,
        UpdateDeliveryStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _orderService.UpdateDeliveryStatusAsync(id, request, cancellationToken));
    }
}
