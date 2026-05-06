using System.Text;
using Flowoff.Application.DTOs.Auth;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Flowoff.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;

namespace Flowoff.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly UserManager<ApplicationUser> _userManager;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IJwtTokenGenerator jwtTokenGenerator,
        IEmailSender emailSender,
        IConfiguration configuration,
        ICurrentUserService currentUserService)
    {
        _userManager = userManager;
        _jwtTokenGenerator = jwtTokenGenerator;
        _emailSender = emailSender;
        _configuration = configuration;
        _currentUserService = currentUserService;
    }

    public async Task ChangePasswordAsync(ChangePasswordRequestDto request, CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync();
        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }
    }

    public async Task ConfirmEmailAsync(ConfirmEmailRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user is null || user.IsDeleted)
        {
            throw new InvalidOperationException("User not found.");
        }

        var token = DecodeToken(request.Token);
        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }
    }

    public async Task<ForgotPasswordResponseDto> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || user.IsDeleted || !await _userManager.IsEmailConfirmedAsync(user))
        {
            return new ForgotPasswordResponseDto
            {
                Message = "If the account exists, a password reset email has been sent."
            };
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = EncodeToken(token);
        var resetUrl = BuildFrontendUrl("/account", new Dictionary<string, string?>
        {
            ["mode"] = "reset",
            ["email"] = user.Email,
            ["token"] = encodedToken
        });

        await _emailSender.SendAsync(
            user.Email!,
            "Восстановление пароля Flowoff",
            $"""
            <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#1f2a23">
              <h2 style="margin-bottom:12px;">Восстановление пароля</h2>
              <p>Мы получили запрос на смену пароля для аккаунта <strong>{user.Email}</strong>.</p>
              <p>Чтобы задать новый пароль, перейдите по ссылке:</p>
              <p style="margin:20px 0;">
                <a href="{resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#6a9c7b;color:#ffffff;text-decoration:none;font-weight:600;">
                  Сбросить пароль
                </a>
              </p>
              <p>Если кнопка не открывается, используйте эту ссылку:</p>
              <p><a href="{resetUrl}">{resetUrl}</a></p>
              <p style="margin-top:16px;color:#5a665f;font-size:14px;">Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
            </div>
            """,
            cancellationToken);

        return new ForgotPasswordResponseDto
        {
            Message = "If the account exists, a password reset email has been sent."
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || user.IsDeleted)
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        var validPassword = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!validPassword)
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        if (!await _userManager.IsEmailConfirmedAsync(user))
        {
            throw new InvalidOperationException("Email confirmation is required before login.");
        }

        return _jwtTokenGenerator.Generate(user.Id, user.Email!, user.FullName, user.Role.ToString());
    }

    public async Task<AuthResponseDto> UpdateProfileAsync(UpdateProfileRequestDto request, CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync();

        var normalizedEmail = request.Email.Trim();
        var normalizedFullName = request.FullName.Trim();

        var existingUser = await _userManager.FindByEmailAsync(normalizedEmail);
        if (existingUser is not null && existingUser.Id != user.Id && !existingUser.IsDeleted)
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        user.Email = normalizedEmail;
        user.UserName = normalizedEmail;
        user.FullName = normalizedFullName;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }

        return _jwtTokenGenerator.Generate(user.Id, user.Email!, user.FullName, user.Role.ToString());
    }

    public async Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null && !existingUser.IsDeleted)
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            Role = UserRole.Customer
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }

        await _userManager.AddToRoleAsync(user, UserRole.Customer.ToString());
        await SendEmailConfirmationAsync(user, cancellationToken);

        return new RegisterResponseDto
        {
            Message = "Registration completed. Please confirm your email before login.",
            RequiresEmailConfirmation = true
        };
    }

    public async Task ResendConfirmationEmailAsync(ResendConfirmationEmailRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || user.IsDeleted)
        {
            return;
        }

        if (await _userManager.IsEmailConfirmedAsync(user))
        {
            return;
        }

        await SendEmailConfirmationAsync(user, cancellationToken);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || user.IsDeleted)
        {
            throw new InvalidOperationException("User not found.");
        }

        var token = DecodeToken(request.Token);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }
    }

    private async Task SendEmailConfirmationAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = EncodeToken(token);
        var confirmationUrl = BuildFrontendUrl("/confirm-email", new Dictionary<string, string?>
        {
            ["userId"] = user.Id,
            ["token"] = encodedToken
        });

        await _emailSender.SendAsync(
            user.Email!,
            "Подтверждение регистрации Flowoff",
            $"""
            <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#1f2a23">
              <h2 style="margin-bottom:12px;">Подтвердите регистрацию</h2>
              <p>Спасибо за регистрацию в <strong>Flowoff</strong>.</p>
              <p>Чтобы активировать аккаунт, перейдите по ссылке:</p>
              <p style="margin:20px 0;">
                <a href="{confirmationUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#6a9c7b;color:#ffffff;text-decoration:none;font-weight:600;">
                  Подтвердить почту
                </a>
              </p>
              <p>Если кнопка не открывается, используйте эту ссылку:</p>
              <p><a href="{confirmationUrl}">{confirmationUrl}</a></p>
            </div>
            """,
            cancellationToken);
    }

    private string BuildApiUrl(string path, IDictionary<string, string?> query)
    {
        var baseUrl = _configuration["ApplicationUrls:ApiBaseUrl"]?.TrimEnd('/')
            ?? "http://localhost:5277";

        return QueryHelpers.AddQueryString($"{baseUrl}/api/{path}", query);
    }

    private string BuildFrontendUrl(string path, IDictionary<string, string?> query)
    {
        var baseUrl = _configuration["ApplicationUrls:FrontendBaseUrl"]?.TrimEnd('/')
            ?? "http://127.0.0.1:5173";

        return QueryHelpers.AddQueryString($"{baseUrl}{path}", query);
    }

    private static string EncodeToken(string token)
    {
        return WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
    }

    private static string DecodeToken(string token)
    {
        var bytes = WebEncoders.Base64UrlDecode(token);
        return Encoding.UTF8.GetString(bytes);
    }

    private async Task<ApplicationUser> GetCurrentUserAsync()
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            throw new InvalidOperationException("Authenticated user is required.");
        }

        var user = await _userManager.FindByIdAsync(_currentUserService.UserId);
        if (user is null || user.IsDeleted)
        {
            throw new InvalidOperationException("User not found.");
        }

        return user;
    }
}
