using Flowoff.Application.DTOs.Support;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SupportRequestsController : ControllerBase
{
    private readonly ISupportRequestService _supportRequestService;

    public SupportRequestsController(ISupportRequestService supportRequestService)
    {
        _supportRequestService = supportRequestService;
    }

    [HttpGet("my")]
    [Authorize(Roles = nameof(UserRole.Customer))]
    [ProducesResponseType(typeof(IReadOnlyCollection<SupportRequestDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<SupportRequestDto>>> GetMy(CancellationToken cancellationToken)
    {
        return Ok(await _supportRequestService.GetMyAsync(cancellationToken));
    }

    [HttpGet]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    [ProducesResponseType(typeof(IReadOnlyCollection<SupportRequestDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<SupportRequestDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _supportRequestService.GetAllAsync(cancellationToken));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Customer))]
    [ProducesResponseType(typeof(SupportRequestDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<SupportRequestDto>> Create(CreateSupportRequestDto request, CancellationToken cancellationToken)
    {
        var created = await _supportRequestService.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    [ProducesResponseType(typeof(SupportRequestDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SupportRequestDto>> UpdateStatus(
        Guid id,
        UpdateSupportRequestStatusDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _supportRequestService.UpdateStatusAsync(id, request, cancellationToken));
    }
}
