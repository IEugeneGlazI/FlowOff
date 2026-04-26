using Flowoff.Application.DTOs.Users;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Administrator))]
[Route("api/admin/users")]
public class AdminUsersController : ControllerBase
{
    private readonly IUserManagementService _userManagementService;

    public AdminUsersController(IUserManagementService userManagementService)
    {
        _userManagementService = userManagementService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<UserManagementDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<UserManagementDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _userManagementService.GetAllAsync(cancellationToken));
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(UserManagementDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserManagementDto>> Update(
        string id,
        UpdateUserRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _userManagementService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpPatch("{id}/block")]
    [ProducesResponseType(typeof(UserManagementDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserManagementDto>> UpdateBlockStatus(
        string id,
        UpdateUserBlockStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _userManagementService.UpdateBlockStatusAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        await _userManagementService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
