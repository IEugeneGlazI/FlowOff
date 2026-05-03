using Flowoff.Application.DTOs.Addresses;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Customer))]
[Route("api/address-suggestions")]
public class AddressSuggestionsController : ControllerBase
{
    private readonly IAddressSuggestionService _addressSuggestionService;

    public AddressSuggestionsController(IAddressSuggestionService addressSuggestionService)
    {
        _addressSuggestionService = addressSuggestionService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<AddressSuggestionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<AddressSuggestionDto>>> Get(
        [FromQuery] string query,
        CancellationToken cancellationToken)
    {
        var suggestions = await _addressSuggestionService.SuggestAsync(query, cancellationToken);
        return Ok(suggestions);
    }
}
