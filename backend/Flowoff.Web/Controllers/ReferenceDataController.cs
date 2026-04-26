using Flowoff.Application.DTOs.References;
using Flowoff.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/references")]
public class ReferenceDataController : ControllerBase
{
    private readonly IReferenceDataService _referenceDataService;

    public ReferenceDataController(IReferenceDataService referenceDataService)
    {
        _referenceDataService = referenceDataService;
    }

    [HttpGet("statuses")]
    [ProducesResponseType(typeof(IReadOnlyCollection<StatusReferenceItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<StatusReferenceItemDto>>> GetStatuses(CancellationToken cancellationToken)
    {
        return Ok(await _referenceDataService.GetStatusesAsync(cancellationToken));
    }
}
