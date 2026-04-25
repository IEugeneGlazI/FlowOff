using Flowoff.Application.DTOs.CustomBouquets;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Customer))]
[Route("api/[controller]")]
public class CustomBouquetsController : ControllerBase
{
    private readonly ICustomBouquetService _customBouquetService;

    public CustomBouquetsController(ICustomBouquetService customBouquetService)
    {
        _customBouquetService = customBouquetService;
    }

    [HttpPost("calculate")]
    [ProducesResponseType(typeof(CustomBouquetCalculationDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CustomBouquetCalculationDto>> Calculate(
        IReadOnlyCollection<CustomBouquetItemRequestDto> items,
        CancellationToken cancellationToken)
    {
        return Ok(await _customBouquetService.CalculateAsync(items, cancellationToken));
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(IReadOnlyCollection<CustomBouquetDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<CustomBouquetDto>>> GetMy(CancellationToken cancellationToken)
    {
        return Ok(await _customBouquetService.GetMyAsync(cancellationToken));
    }

    [HttpPost]
    [ProducesResponseType(typeof(CustomBouquetDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<CustomBouquetDto>> Create(
        CreateCustomBouquetRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _customBouquetService.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, created);
    }
}
