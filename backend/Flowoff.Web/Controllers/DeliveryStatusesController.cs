using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DeliveryStatusesController : ControllerBase
{
    private readonly IDeliveryStatusReferenceRepository _deliveryStatusReferenceRepository;

    public DeliveryStatusesController(IDeliveryStatusReferenceRepository deliveryStatusReferenceRepository)
    {
        _deliveryStatusReferenceRepository = deliveryStatusReferenceRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var statuses = await _deliveryStatusReferenceRepository.GetAllAsync(cancellationToken);
        return Ok(statuses.Select(status => new
        {
            status.Id,
            status.Name
        }));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    public async Task<IActionResult> Update(Guid id, UpdateStatusReferenceRequest request, CancellationToken cancellationToken)
    {
        var status = await _deliveryStatusReferenceRepository.GetByIdAsync(id, cancellationToken);
        if (status is null)
        {
            return NotFound();
        }

        status.Update(request.Name.Trim());
        await _deliveryStatusReferenceRepository.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            status.Id,
            status.Name
        });
    }

    public sealed record UpdateStatusReferenceRequest(string Name);
}
