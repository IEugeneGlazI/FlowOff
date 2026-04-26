using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Flowoff.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}
