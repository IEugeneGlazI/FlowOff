using Flowoff.Application.DTOs.Auth;

namespace Flowoff.Application.Interfaces;

public interface IJwtTokenGenerator
{
    AuthResponseDto Generate(string userId, string email, string fullName, string role);
}
