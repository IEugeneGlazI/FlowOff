using Flowoff.Application.DTOs.Reservations;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationsController(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [HttpGet("my")]
    [Authorize(Roles = nameof(UserRole.Customer))]
    [ProducesResponseType(typeof(IReadOnlyCollection<ReservationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<ReservationDto>>> GetMyReservations(CancellationToken cancellationToken)
    {
        return Ok(await _reservationService.GetMyReservationsAsync(cancellationToken));
    }

    [HttpGet("active")]
    [Authorize(Roles = nameof(UserRole.Florist) + "," + nameof(UserRole.Administrator))]
    [ProducesResponseType(typeof(IReadOnlyCollection<ReservationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<ReservationDto>>> GetActive(CancellationToken cancellationToken)
    {
        return Ok(await _reservationService.GetActiveReservationsAsync(cancellationToken));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Customer))]
    [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ReservationDto>> Create(CreateReservationRequestDto request, CancellationToken cancellationToken)
    {
        var reservation = await _reservationService.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, reservation);
    }

    [HttpDelete("{reservationId:guid}")]
    [Authorize(Roles = nameof(UserRole.Customer) + "," + nameof(UserRole.Florist) + "," + nameof(UserRole.Administrator))]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Cancel(Guid reservationId, CancellationToken cancellationToken)
    {
        await _reservationService.CancelAsync(reservationId, cancellationToken);
        return NoContent();
    }
}
