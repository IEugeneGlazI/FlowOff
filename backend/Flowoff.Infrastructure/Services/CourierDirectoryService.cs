using Flowoff.Application.DTOs.Users;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Flowoff.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Services;

public class CourierDirectoryService : ICourierDirectoryService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public CourierDirectoryService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<CourierDto?> GetCourierByEmailAsync(string email, CancellationToken cancellationToken)
    {
        var courier = await _userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Email == email && user.Role == UserRole.Courier, cancellationToken);

        return courier is null ? null : Map(courier);
    }

    public async Task<IReadOnlyCollection<CourierDto>> GetCouriersAsync(CancellationToken cancellationToken)
    {
        var couriers = await _userManager.Users
            .AsNoTracking()
            .Where(user => user.Role == UserRole.Courier)
            .OrderBy(user => user.FullName)
            .ToArrayAsync(cancellationToken);

        return couriers.Select(Map).ToArray();
    }

    private static CourierDto Map(ApplicationUser user) =>
        new()
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName
        };
}
