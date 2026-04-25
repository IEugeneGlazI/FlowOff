using Flowoff.Application.DTOs.Support;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class SupportRequestService : ISupportRequestService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly ISupportRequestRepository _supportRequestRepository;

    public SupportRequestService(
        ISupportRequestRepository supportRequestRepository,
        ICurrentUserService currentUserService)
    {
        _supportRequestRepository = supportRequestRepository;
        _currentUserService = currentUserService;
    }

    public async Task<SupportRequestDto> CreateAsync(CreateSupportRequestDto request, CancellationToken cancellationToken)
    {
        var customerId = GetRequiredUserId();
        var supportRequest = new SupportRequest(customerId, request.Subject, request.Message);
        await _supportRequestRepository.AddAsync(supportRequest, cancellationToken);
        return Map(supportRequest);
    }

    public async Task<IReadOnlyCollection<SupportRequestDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var supportRequests = await _supportRequestRepository.GetAllAsync(cancellationToken);
        return supportRequests.Select(Map).ToArray();
    }

    public async Task<IReadOnlyCollection<SupportRequestDto>> GetMyAsync(CancellationToken cancellationToken)
    {
        var supportRequests = await _supportRequestRepository.GetByCustomerIdAsync(GetRequiredUserId(), cancellationToken);
        return supportRequests.Select(Map).ToArray();
    }

    public async Task<SupportRequestDto> UpdateStatusAsync(Guid id, UpdateSupportRequestStatusDto request, CancellationToken cancellationToken)
    {
        var supportRequest = await _supportRequestRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Support request not found.");

        if (!Enum.TryParse<SupportRequestStatus>(request.Status, true, out var status))
        {
            throw new InvalidOperationException("Invalid support request status.");
        }

        supportRequest.SetStatus(status);
        await _supportRequestRepository.SaveChangesAsync(cancellationToken);
        return Map(supportRequest);
    }

    private string GetRequiredUserId()
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            throw new InvalidOperationException("Authenticated user is required.");
        }

        return _currentUserService.UserId;
    }

    private static SupportRequestDto Map(SupportRequest supportRequest) =>
        new()
        {
            Id = supportRequest.Id,
            CustomerId = supportRequest.CustomerId,
            Subject = supportRequest.Subject,
            Message = supportRequest.Message,
            Status = supportRequest.Status.ToString(),
            CreatedAtUtc = supportRequest.CreatedAtUtc
        };
}
