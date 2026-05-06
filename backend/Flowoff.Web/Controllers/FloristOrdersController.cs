using Flowoff.Application.DTOs.Orders;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Florist) + "," + nameof(UserRole.Administrator))]
[Route("api/florist/orders")]
public class FloristOrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public FloristOrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<OrderDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<OrderDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _orderService.GetAllAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var order = await _orderService.GetByIdAsync(id, cancellationToken);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPatch("{id:guid}/assembly-status")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OrderDto>> UpdateAssemblyStatus(
        Guid id,
        UpdateAssemblyStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _orderService.UpdateAssemblyStatusAsync(id, request, cancellationToken));
    }

    [HttpPatch("{id:guid}/complete-pickup")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OrderDto>> CompletePickup(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _orderService.CompletePickupAsync(id, cancellationToken));
    }

    [HttpPatch("{id:guid}/assign-courier")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OrderDto>> AssignCourier(
        Guid id,
        AssignCourierRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _orderService.AssignCourierAsync(id, request, cancellationToken));
    }
}
