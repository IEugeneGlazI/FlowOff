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

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(UserManagementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserManagementDto>> GetById(string id, CancellationToken cancellationToken)
    {
        var user = await _userManagementService.GetByIdAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost]
    [ProducesResponseType(typeof(UserManagementDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserManagementDto>> Create(
        CreateUserRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _userManagementService.CreateAsync(request, cancellationToken));
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

    [HttpPost("{id}/send-password-reset")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SendPasswordReset(string id, CancellationToken cancellationToken)
    {
        await _userManagementService.SendPasswordResetAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id}/restore")]
    [ProducesResponseType(typeof(UserManagementDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserManagementDto>> Restore(string id, CancellationToken cancellationToken)
    {
        return Ok(await _userManagementService.RestoreAsync(id, cancellationToken));
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        await _userManagementService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
