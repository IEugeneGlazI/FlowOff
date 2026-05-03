using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Flowoff.Application.DTOs.Addresses;
using Flowoff.Application.Interfaces;
using Flowoff.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Flowoff.Infrastructure.Services;

public sealed class DaDataAddressSuggestionService : IAddressSuggestionService
{
    private static readonly IReadOnlyList<AddressSuggestionDto> FallbackSuggestions =
    [
        new AddressSuggestionDto
        {
            Value = "г Москва, ул Цветочная, д 15",
            UnrestrictedValue = "г Москва, ул Цветочная, д 15",
            City = "Москва",
            Street = "Цветочная",
            House = "15"
        },
        new AddressSuggestionDto
        {
            Value = "г Москва, ул Садовая, д 10",
            UnrestrictedValue = "г Москва, ул Садовая, д 10",
            City = "Москва",
            Street = "Садовая",
            House = "10"
        },
        new AddressSuggestionDto
        {
            Value = "г Москва, пр-кт Мира, д 119",
            UnrestrictedValue = "г Москва, пр-кт Мира, д 119",
            City = "Москва",
            Street = "Мира",
            House = "119"
        },
        new AddressSuggestionDto
        {
            Value = "г Санкт-Петербург, Невский пр-кт, д 28",
            UnrestrictedValue = "г Санкт-Петербург, Невский пр-кт, д 28",
            City = "Санкт-Петербург",
            Street = "Невский",
            House = "28"
        },
        new AddressSuggestionDto
        {
            Value = "г Казань, ул Баумана, д 7",
            UnrestrictedValue = "г Казань, ул Баумана, д 7",
            City = "Казань",
            Street = "Баумана",
            House = "7"
        }
    ];

    private readonly HttpClient _httpClient;
    private readonly ILogger<DaDataAddressSuggestionService> _logger;
    private readonly DaDataOptions _options;

    public DaDataAddressSuggestionService(
        HttpClient httpClient,
        IOptions<DaDataOptions> options,
        ILogger<DaDataAddressSuggestionService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _options = options.Value;
    }

    public async Task<IReadOnlyCollection<AddressSuggestionDto>> SuggestAsync(string query, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 3)
        {
            return [];
        }

        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            _logger.LogInformation("DaData API key is not configured. Returning local address suggestions.");
            return GetFallbackSuggestions(query);
        }

        try
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                "/suggestions/api/4_1/rs/suggest/address");

            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Token", _options.ApiKey);

            var payload = JsonSerializer.Serialize(new
            {
                query,
                count = Math.Clamp(_options.Count, 1, 20),
                language = "ru"
            });

            request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("DaData address suggestions request failed with status {StatusCode}.", response.StatusCode);
                return GetFallbackSuggestions(query);
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var result = await JsonSerializer.DeserializeAsync<DaDataResponse>(
                stream,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
                cancellationToken);

            var suggestions = result?.Suggestions.Select(item => new AddressSuggestionDto
            {
                Value = item.Value ?? string.Empty,
                UnrestrictedValue = item.UnrestrictedValue ?? item.Value ?? string.Empty,
                PostalCode = item.Data?.PostalCode,
                City = item.Data?.City ?? item.Data?.Settlement,
                Street = item.Data?.Street,
                House = item.Data?.House
            }).Where(item => !string.IsNullOrWhiteSpace(item.Value)).ToArray() ?? [];

            return suggestions.Length > 0 ? suggestions : GetFallbackSuggestions(query);
        }
        catch (Exception exception) when (exception is HttpRequestException or JsonException or TaskCanceledException)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                throw;
            }

            _logger.LogWarning(exception, "DaData address suggestions request failed. Returning local suggestions.");
            return GetFallbackSuggestions(query);
        }
    }

    private IReadOnlyCollection<AddressSuggestionDto> GetFallbackSuggestions(string query)
    {
        var normalizedQuery = query.Trim();
        var count = Math.Clamp(_options.Count, 1, FallbackSuggestions.Count);

        var matchingSuggestions = FallbackSuggestions
            .Where(item => item.Value.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase)
                || item.UnrestrictedValue.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase)
                || item.City?.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase) == true
                || item.Street?.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase) == true)
            .Take(count)
            .ToArray();

        if (matchingSuggestions.Length > 0)
        {
            return matchingSuggestions;
        }

        return
        [
            new AddressSuggestionDto
            {
                Value = normalizedQuery,
                UnrestrictedValue = normalizedQuery
            }
        ];
    }

    private sealed class DaDataResponse
    {
        public List<DaDataSuggestion> Suggestions { get; init; } = [];
    }

    private sealed class DaDataSuggestion
    {
        public string? Value { get; init; }
        public string? UnrestrictedValue { get; init; }
        public DaDataSuggestionData? Data { get; init; }
    }

    private sealed class DaDataSuggestionData
    {
        public string? PostalCode { get; init; }
        public string? City { get; init; }
        public string? Settlement { get; init; }
        public string? Street { get; init; }
        public string? House { get; init; }
    }
}
