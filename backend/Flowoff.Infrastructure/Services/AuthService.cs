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
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly UserManager<ApplicationUser> _userManager;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IJwtTokenGenerator jwtTokenGenerator,
        IEmailSender emailSender,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _jwtTokenGenerator = jwtTokenGenerator;
        _emailSender = emailSender;
        _configuration = configuration;
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
        await _emailSender.SendAsync(
            user.Email!,
            "Восстановление пароля Flowoff",
            $"""
            <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#1f2a23">
              <h2 style="margin-bottom:12px;">Восстановление пароля</h2>
              <p>Мы получили запрос на смену пароля для аккаунта <strong>{user.Email}</strong>.</p>
              <p>Пока на фронтенде нет отдельной формы сброса, поэтому для dev-режима используй этот токен:</p>
              <div style="padding:12px 16px;border-radius:12px;background:#f3f7f4;border:1px solid #d7e4da;word-break:break-all;">
                {encodedToken}
              </div>
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
        var confirmationUrl = BuildUrl("Auth/confirm-email", new Dictionary<string, string?>
        {
            ["userId"] = user.Id,
            ["token"] = encodedToken
        });

        await _emailSender.SendAsync(
            user.Email!,
            "Подтверждение регистрации Flowoff",
            $"""
            <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#1f2a23">
              <h2 style="margin-bottom:12px;">Подтверди регистрацию</h2>
              <p>Спасибо за регистрацию в <strong>Flowoff</strong>.</p>
              <p>Чтобы активировать аккаунт, перейди по ссылке:</p>
              <p style="margin:20px 0;">
                <a href="{confirmationUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#6a9c7b;color:#ffffff;text-decoration:none;font-weight:600;">
                  Подтвердить почту
                </a>
              </p>
              <p>Если кнопка не открывается, используй эту ссылку:</p>
              <p><a href="{confirmationUrl}">{confirmationUrl}</a></p>
            </div>
            """,
            cancellationToken);
    }

    private string BuildUrl(string path, IDictionary<string, string?> query)
    {
        var baseUrl = _configuration["ApplicationUrls:ApiBaseUrl"]?.TrimEnd('/')
            ?? "https://localhost:7225";

        return QueryHelpers.AddQueryString($"{baseUrl}/api/{path}", query);
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
}
