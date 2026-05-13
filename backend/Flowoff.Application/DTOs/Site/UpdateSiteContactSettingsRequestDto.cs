namespace Flowoff.Application.DTOs.Site;

public class UpdateSiteContactSettingsRequestDto
{
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string WorkingHours { get; set; } = string.Empty;
    public string VkUrl { get; set; } = string.Empty;
    public string TelegramUrl { get; set; } = string.Empty;
}
