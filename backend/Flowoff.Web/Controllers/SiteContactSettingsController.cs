using Flowoff.Application.DTOs.Site;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Route("api/site/contact-settings")]
public class SiteContactSettingsController : ControllerBase
{
    private readonly ISiteContactSettingsService _siteContactSettingsService;

    public SiteContactSettingsController(ISiteContactSettingsService siteContactSettingsService)
    {
        _siteContactSettingsService = siteContactSettingsService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(SiteContactSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SiteContactSettingsDto>> Get(CancellationToken cancellationToken)
    {
        return Ok(await _siteContactSettingsService.GetAsync(cancellationToken));
    }

    [Authorize(Roles = nameof(UserRole.Administrator))]
    [HttpPut]
    [ProducesResponseType(typeof(SiteContactSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SiteContactSettingsDto>> Update(
        UpdateSiteContactSettingsRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _siteContactSettingsService.UpdateAsync(request, cancellationToken));
    }
}
