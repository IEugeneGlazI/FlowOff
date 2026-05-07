using Flowoff.Domain.Repositories;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ColorsController : ControllerBase
{
    private readonly IColorRepository _colorRepository;

    public ColorsController(IColorRepository colorRepository)
    {
        _colorRepository = colorRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var colors = await _colorRepository.GetAllAsync(cancellationToken);
        return Ok(colors.Select(color => new
        {
            color.Id,
            color.Name
        }));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    public async Task<IActionResult> Create(UpdateColorRequest request, CancellationToken cancellationToken)
    {
        var color = new Flowoff.Domain.Entities.Color(request.Name.Trim());
        await _colorRepository.AddAsync(color, cancellationToken);
        await _colorRepository.SaveChangesAsync(cancellationToken);
        return Ok(new { color.Id, color.Name });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    public async Task<IActionResult> Update(Guid id, UpdateColorRequest request, CancellationToken cancellationToken)
    {
        var color = await _colorRepository.GetByIdAsync(id, cancellationToken);
        if (color is null)
        {
            return NotFound();
        }

        color.Update(request.Name.Trim());
        await _colorRepository.SaveChangesAsync(cancellationToken);
        return Ok(new { color.Id, color.Name });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var color = await _colorRepository.GetByIdAsync(id, cancellationToken);
        if (color is null)
        {
            return NotFound();
        }

        color.SoftDelete();
        await _colorRepository.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    public sealed record UpdateColorRequest(string Name);
}
