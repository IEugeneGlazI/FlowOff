namespace Flowoff.Infrastructure.Options;

public sealed class DaDataOptions
{
    public string BaseUrl { get; init; } = "https://suggestions.dadata.ru";
    public string ApiKey { get; init; } = string.Empty;
    public int Count { get; init; } = 7;
}
