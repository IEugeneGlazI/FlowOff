using System.ComponentModel.DataAnnotations;

namespace Flowoff.Application.DTOs.Users;

public sealed class UserManagementDto
{
    public string Id { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public bool EmailConfirmed { get; init; }
    public bool IsBlocked { get; init; }
    public bool IsDeleted { get; init; }
}

public sealed class UpdateUserRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string FullName { get; init; } = string.Empty;

    [Required]
    public string Role { get; init; } = string.Empty;
}

public sealed class CreateUserRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; init; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string FullName { get; init; } = string.Empty;

    [Required]
    public string Role { get; init; } = string.Empty;
}

public sealed class UpdateUserBlockStatusRequestDto
{
    public bool IsBlocked { get; init; }
}
