using Flowoff.Application.DTOs.Site;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class SiteContactSettingsService : ISiteContactSettingsService
{
    private readonly ISiteContactSettingsRepository _siteContactSettingsRepository;

    public SiteContactSettingsService(ISiteContactSettingsRepository siteContactSettingsRepository)
    {
        _siteContactSettingsRepository = siteContactSettingsRepository;
    }

    public async Task<SiteContactSettingsDto> GetAsync(CancellationToken cancellationToken)
    {
        var settings = await GetOrCreateAsync(cancellationToken);
        return Map(settings);
    }

    public async Task<SiteContactSettingsDto> UpdateAsync(UpdateSiteContactSettingsRequestDto request, CancellationToken cancellationToken)
    {
        var settings = await GetOrCreateAsync(cancellationToken);
        settings.Update(
            request.Phone,
            request.Email,
            request.Address,
            request.WorkingHours,
            request.VkUrl,
            request.TelegramUrl);

        await _siteContactSettingsRepository.SaveChangesAsync(cancellationToken);
        return Map(settings);
    }

    private async Task<SiteContactSettings> GetOrCreateAsync(CancellationToken cancellationToken)
    {
        var settings = await _siteContactSettingsRepository.GetAsync(cancellationToken);
        if (settings is not null)
        {
            return settings;
        }

        settings = new SiteContactSettings(
            phone: "89012862020",
            email: "flowoff37@gmail.com",
            address: "Рабфаковская улица, 34, Фрунзенский район, городской округ Иваново, 153003",
            workingHours: "Круглосуточно",
            vkUrl: "https://vk.com/i_eugeneglaz_i",
            telegramUrl: "https://t.me/+79012862520");

        await _siteContactSettingsRepository.AddAsync(settings, cancellationToken);
        return settings;
    }

    private static SiteContactSettingsDto Map(SiteContactSettings settings) =>
        new()
        {
            Phone = settings.Phone,
            Email = settings.Email,
            Address = settings.Address,
            WorkingHours = settings.WorkingHours,
            VkUrl = settings.VkUrl,
            TelegramUrl = settings.TelegramUrl
        };
}
