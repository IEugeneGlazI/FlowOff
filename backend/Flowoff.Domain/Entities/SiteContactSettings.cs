using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class SiteContactSettings : Entity
{
    public string Phone { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public string WorkingHours { get; private set; } = string.Empty;
    public string VkUrl { get; private set; } = string.Empty;
    public string TelegramUrl { get; private set; } = string.Empty;

    private SiteContactSettings()
    {
    }

    public SiteContactSettings(
        string phone,
        string email,
        string address,
        string workingHours,
        string vkUrl,
        string telegramUrl)
    {
        Update(phone, email, address, workingHours, vkUrl, telegramUrl);
    }

    public void Update(
        string phone,
        string email,
        string address,
        string workingHours,
        string vkUrl,
        string telegramUrl)
    {
        Phone = phone.Trim();
        Email = email.Trim();
        Address = address.Trim();
        WorkingHours = workingHours.Trim();
        VkUrl = vkUrl.Trim();
        TelegramUrl = telegramUrl.Trim();
    }
}
