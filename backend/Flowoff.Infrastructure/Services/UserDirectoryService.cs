using Flowoff.Application.DTOs.Users;
using Flowoff.Application.Interfaces;
using Flowoff.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Services;

public class UserDirectoryService : IUserDirectoryService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UserDirectoryService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<IReadOnlyDictionary<string, UserDirectoryDto>> GetByIdsAsync(IEnumerable<string> userIds, CancellationToken cancellationToken)
    {
        var normalizedIds = userIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (normalizedIds.Length == 0)
        {
            return new Dictionary<string, UserDirectoryDto>(StringComparer.Ordinal);
        }

        var users = await _userManager.Users
            .AsNoTracking()
            .Where(user => normalizedIds.Contains(user.Id))
            .ToArrayAsync(cancellationToken);

        return users.ToDictionary(
            user => user.Id,
            user => new UserDirectoryDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName
            },
            StringComparer.Ordinal);
    }
}
