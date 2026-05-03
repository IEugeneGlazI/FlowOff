using Flowoff.Application.DTOs.Addresses;

namespace Flowoff.Application.Interfaces;

public interface IAddressSuggestionService
{
    Task<IReadOnlyCollection<AddressSuggestionDto>> SuggestAsync(string query, CancellationToken cancellationToken);
}
