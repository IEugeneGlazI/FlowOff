using System.Text;
using Flowoff.Application.DTOs.Users;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Flowoff.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Services;

public class UserManagementService : IUserManagementService
{
    private readonly IConfiguration _configuration;
    private readonly IEmailSender _emailSender;
    private readonly UserManager<ApplicationUser> _userManager;

    public UserManagementService(
        UserManager<ApplicationUser> userManager,
        IEmailSender emailSender,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _emailSender = emailSender;
        _configuration = configuration;
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

    public async Task<UserManagementDto> CreateAsync(CreateUserRequestDto request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
        {
            throw new InvalidOperationException("Invalid user role.");
        }

        var email = request.Email.Trim();
        var fullName = request.FullName.Trim();

        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser is not null && !existingUser.IsDeleted)
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            Role = role,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }

        await _userManager.AddToRoleAsync(user, role.ToString());
        return Map(user);
    }

    public async Task<IReadOnlyCollection<UserManagementDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var users = await _userManager.Users
            .AsNoTracking()
            .OrderBy(user => user.Email)
            .ToArrayAsync(cancellationToken);

        return users.Select(Map).ToArray();
    }

    public async Task<UserManagementDto?> GetByIdAsync(string id, CancellationToken cancellationToken)
    {
        var user = await _userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

        return user is null ? null : Map(user);
    }

    public async Task SendPasswordResetAsync(string id, CancellationToken cancellationToken)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        if (user.IsDeleted || string.IsNullOrWhiteSpace(user.Email))
        {
            throw new InvalidOperationException("Password reset is unavailable for this user.");
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        var resetUrl = BuildFrontendUrl("/account", new Dictionary<string, string?>
        {
            ["mode"] = "reset",
            ["email"] = user.Email,
            ["token"] = encodedToken
        });

        await _emailSender.SendAsync(
            user.Email,
            "Смена пароля Flowoff",
            FlowoffEmailTemplate.Build(
                eyebrow: "Пользователь",
                title: "Ссылка для смены пароля",
                intro: $"Для аккаунта {user.Email} была запрошена смена пароля администратором.",
                details: "Перейдите по кнопке ниже, чтобы задать новый пароль для входа в аккаунт.",
                ctaText: "Сменить пароль",
                ctaUrl: resetUrl,
                footnote: "Если вы не ожидали это письмо, свяжитесь с администрацией магазина."),
            cancellationToken);
    }

    public async Task<UserManagementDto> UpdateAsync(string id, UpdateUserRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
        {
            throw new InvalidOperationException("Invalid user role.");
        }

        var email = request.Email.Trim();
        var fullName = request.FullName.Trim();
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser is not null && existingUser.Id != user.Id && !existingUser.IsDeleted)
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        var oldRole = user.Role.ToString();
        user.Email = email;
        user.UserName = email;
        user.FullName = fullName;
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

    private string BuildFrontendUrl(string path, IDictionary<string, string?> query)
    {
        var baseUrl = _configuration["ApplicationUrls:FrontendBaseUrl"]?.TrimEnd('/')
            ?? "http://127.0.0.1:5173";

        return QueryHelpers.AddQueryString($"{baseUrl}{path}", query);
    }
}
