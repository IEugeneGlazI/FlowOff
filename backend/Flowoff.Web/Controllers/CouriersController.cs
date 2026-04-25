using Flowoff.Application.DTOs.Users;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Florist) + "," + nameof(UserRole.Administrator))]
[Route("api/[controller]")]
public class CouriersController : ControllerBase
{
    private readonly ICourierDirectoryService _courierDirectoryService;

    public CouriersController(ICourierDirectoryService courierDirectoryService)
    {
        _courierDirectoryService = courierDirectoryService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<CourierDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<CourierDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _courierDirectoryService.GetCouriersAsync(cancellationToken));
    }
}
