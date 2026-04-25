using Flowoff.Application.DTOs.Statistics;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Administrator))]
[Route("api/admin/statistics")]
public class AdminStatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public AdminStatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(DashboardStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardStatisticsDto>> GetDashboard(CancellationToken cancellationToken)
    {
        return Ok(await _statisticsService.GetDashboardAsync(cancellationToken));
    }
}
