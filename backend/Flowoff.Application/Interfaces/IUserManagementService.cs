using Flowoff.Application.DTOs.Users;

namespace Flowoff.Application.Interfaces;

public interface IUserManagementService
{
    Task<IReadOnlyCollection<UserManagementDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<UserManagementDto> UpdateAsync(string id, UpdateUserRequestDto request, CancellationToken cancellationToken);
    Task<UserManagementDto> UpdateBlockStatusAsync(string id, UpdateUserBlockStatusRequestDto request, CancellationToken cancellationToken);
    Task DeleteAsync(string id, CancellationToken cancellationToken);
}
