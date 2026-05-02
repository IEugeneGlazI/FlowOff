using Flowoff.Domain.Repositories;
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
}
