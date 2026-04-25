using Flowoff.Application.DTOs.Users;

namespace Flowoff.Application.Interfaces;

public interface ICourierDirectoryService
{
    Task<IReadOnlyCollection<CourierDto>> GetCouriersAsync(CancellationToken cancellationToken);
    Task<CourierDto?> GetCourierByEmailAsync(string email, CancellationToken cancellationToken);
}
