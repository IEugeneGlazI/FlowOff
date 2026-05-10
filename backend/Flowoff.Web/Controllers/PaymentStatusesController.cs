using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentStatusesController : ControllerBase
{
    private readonly IPaymentStatusReferenceRepository _paymentStatusReferenceRepository;

    public PaymentStatusesController(IPaymentStatusReferenceRepository paymentStatusReferenceRepository)
    {
        _paymentStatusReferenceRepository = paymentStatusReferenceRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var statuses = await _paymentStatusReferenceRepository.GetAllAsync(cancellationToken);
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
        var status = await _paymentStatusReferenceRepository.GetByIdAsync(id, cancellationToken);
        if (status is null)
        {
            return NotFound();
        }

        status.Update(request.Name.Trim());
        await _paymentStatusReferenceRepository.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            status.Id,
            status.Name
        });
    }

    public sealed record UpdateStatusReferenceRequest(string Name);
}
