using Flowoff.Application.DTOs.Users;

namespace Flowoff.Application.Interfaces;

public interface IUserDirectoryService
{
    Task<IReadOnlyDictionary<string, UserDirectoryDto>> GetByIdsAsync(IEnumerable<string> userIds, CancellationToken cancellationToken);
}
