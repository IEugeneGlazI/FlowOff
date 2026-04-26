using Flowoff.Application.DTOs.Users;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Flowoff.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Services;

public class UserManagementService : IUserManagementService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UserManagementService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        user.IsDeleted = true;
        user.DeletedAtUtc = DateTime.UtcNow;
        user.LockoutEnabled = true;
        user.LockoutEnd = DateTimeOffset.MaxValue;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }
    }

    public async Task<IReadOnlyCollection<UserManagementDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var users = await _userManager.Users
            .AsNoTracking()
            .OrderBy(user => user.Email)
            .ToArrayAsync(cancellationToken);

        return users.Select(Map).ToArray();
    }

    public async Task<UserManagementDto> UpdateAsync(string id, UpdateUserRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
        {
            throw new InvalidOperationException("Invalid user role.");
        }

        var oldRole = user.Role.ToString();
        user.FullName = request.FullName;
        user.Role = role;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }

        if (!string.Equals(oldRole, role.ToString(), StringComparison.Ordinal))
        {
            await _userManager.RemoveFromRoleAsync(user, oldRole);
            await _userManager.AddToRoleAsync(user, role.ToString());
        }

        return Map(user);
    }

    public async Task<UserManagementDto> UpdateBlockStatusAsync(string id, UpdateUserBlockStatusRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        user.LockoutEnabled = true;
        user.LockoutEnd = request.IsBlocked ? DateTimeOffset.MaxValue : null;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }

        return Map(user);
    }

    private static UserManagementDto Map(ApplicationUser user) =>
        new()
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            EmailConfirmed = user.EmailConfirmed,
            IsBlocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow,
            IsDeleted = user.IsDeleted
        };
}
