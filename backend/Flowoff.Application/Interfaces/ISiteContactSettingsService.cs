using Flowoff.Application.DTOs.Site;

namespace Flowoff.Application.Interfaces;

public interface ISiteContactSettingsService
{
    Task<SiteContactSettingsDto> GetAsync(CancellationToken cancellationToken);
    Task<SiteContactSettingsDto> UpdateAsync(UpdateSiteContactSettingsRequestDto request, CancellationToken cancellationToken);
}
