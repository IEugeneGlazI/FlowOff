using System.ComponentModel.DataAnnotations;

namespace Flowoff.Application.DTOs.Auth;

public sealed class RegisterRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; init; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FullName { get; init; } = string.Empty;
}

public sealed class LoginRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public string Password { get; init; } = string.Empty;
}

public sealed class ConfirmEmailRequestDto
{
    [Required]
    public string UserId { get; init; } = string.Empty;

    [Required]
    public string Token { get; init; } = string.Empty;
}

public sealed class ForgotPasswordRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;
}

public sealed class ResetPasswordRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public string Token { get; init; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; init; } = string.Empty;
}

public sealed class ResendConfirmationEmailRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;
}

public sealed class RegisterResponseDto
{
    public string Message { get; init; } = string.Empty;
    public bool RequiresEmailConfirmation { get; init; }
}

public sealed class ForgotPasswordResponseDto
{
    public string Message { get; init; } = string.Empty;
}

public sealed class AuthResponseDto
{
    public string Token { get; init; } = string.Empty;
    public DateTime ExpiresAtUtc { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
}
