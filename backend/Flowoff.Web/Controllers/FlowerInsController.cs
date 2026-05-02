using Flowoff.Domain.Repositories;
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
}
