namespace Flowoff.Application.DTOs.Addresses;

public sealed class AddressSuggestionDto
{
    public string Value { get; init; } = string.Empty;
    public string UnrestrictedValue { get; init; } = string.Empty;
    public string? PostalCode { get; init; }
    public string? City { get; init; }
    public string? Street { get; init; }
    public string? House { get; init; }
}
