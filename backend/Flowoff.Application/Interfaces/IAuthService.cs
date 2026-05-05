using Flowoff.Application.DTOs.Auth;

namespace Flowoff.Application.Interfaces;

public interface IAuthService
{
    Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken);
    Task<AuthResponseDto> UpdateProfileAsync(UpdateProfileRequestDto request, CancellationToken cancellationToken);
    Task ChangePasswordAsync(ChangePasswordRequestDto request, CancellationToken cancellationToken);
    Task ConfirmEmailAsync(ConfirmEmailRequestDto request, CancellationToken cancellationToken);
    Task<ForgotPasswordResponseDto> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken);
    Task ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken);
    Task ResendConfirmationEmailAsync(ResendConfirmationEmailRequestDto request, CancellationToken cancellationToken);
}
