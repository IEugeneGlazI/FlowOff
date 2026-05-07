using Flowoff.Domain.Repositories;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FlowerInsController : ControllerBase
{
    private readonly IFlowerInRepository _flowerInRepository;

    public FlowerInsController(IFlowerInRepository flowerInRepository)
    {
        _flowerInRepository = flowerInRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var flowerIns = await _flowerInRepository.GetAllAsync(cancellationToken);
        return Ok(flowerIns.Select(item => new
        {
            item.Id,
            item.Name
        }));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    public async Task<IActionResult> Create(UpdateFlowerInRequest request, CancellationToken cancellationToken)
    {
        var flowerIn = new Flowoff.Domain.Entities.FlowerIn(request.Name.Trim());
        await _flowerInRepository.AddAsync(flowerIn, cancellationToken);
        await _flowerInRepository.SaveChangesAsync(cancellationToken);
        return Ok(new { flowerIn.Id, flowerIn.Name });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    public async Task<IActionResult> Update(Guid id, UpdateFlowerInRequest request, CancellationToken cancellationToken)
    {
        var flowerIn = await _flowerInRepository.GetByIdAsync(id, cancellationToken);
        if (flowerIn is null)
        {
            return NotFound();
        }

        flowerIn.Update(request.Name.Trim());
        await _flowerInRepository.SaveChangesAsync(cancellationToken);
        return Ok(new { flowerIn.Id, flowerIn.Name });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var flowerIn = await _flowerInRepository.GetByIdAsync(id, cancellationToken);
        if (flowerIn is null)
        {
            return NotFound();
        }

        flowerIn.SoftDelete();
        await _flowerInRepository.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    public sealed record UpdateFlowerInRequest(string Name);
}
