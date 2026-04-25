using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Flowoff.Application.DTOs.Auth;
using Flowoff.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Flowoff.Infrastructure.Services;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public AuthResponseDto Generate(string userId, string email, string fullName, string role)
    {
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key is not configured.");
        var issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT issuer is not configured.");
        var audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT audience is not configured.");
        var expiresMinutes = int.TryParse(_configuration["Jwt:ExpiresMinutes"], out var parsedExpiresMinutes)
            ? parsedExpiresMinutes
            : 120;

        var expiresAtUtc = DateTime.UtcNow.AddMinutes(expiresMinutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, fullName),
            new(ClaimTypes.Role, role)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new AuthResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAtUtc = expiresAtUtc,
            Email = email,
            FullName = fullName,
            Role = role
        };
    }
}
