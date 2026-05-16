using Flowoff.Application.DTOs.Support;
using Flowoff.Application.DTOs.Users;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Flowoff.Domain.Statuses;

namespace Flowoff.Application.Services;

public class SupportRequestService : ISupportRequestService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly ISupportRequestRepository _supportRequestRepository;
    private readonly ISupportStatusReferenceRepository _supportStatusReferenceRepository;
    private readonly IUserDirectoryService _userDirectoryService;

    public SupportRequestService(
        ISupportRequestRepository supportRequestRepository,
        ISupportStatusReferenceRepository supportStatusReferenceRepository,
        IUserDirectoryService userDirectoryService,
        ICurrentUserService currentUserService)
    {
        _supportRequestRepository = supportRequestRepository;
        _supportStatusReferenceRepository = supportStatusReferenceRepository;
        _userDirectoryService = userDirectoryService;
        _currentUserService = currentUserService;
    }

    public async Task<SupportRequestDto> CreateAsync(CreateSupportRequestDto request, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        var role = GetRequiredUserRole();

        if (string.IsNullOrWhiteSpace(request.Message) && request.Attachments.Count == 0)
        {
            throw new InvalidOperationException("Message or at least one attachment is required.");
        }

        var newStatus = await GetRequiredStatusAsync(SupportStatusCodes.New, cancellationToken);
        var supportRequest = new SupportRequest(userId, request.Subject.Trim(), request.OrderId, newStatus.Id, newStatus.Name);

        var initialMessage = CreateMessage(
            userId,
            role,
            request.Message ?? string.Empty,
            request.Attachments);

        supportRequest.AddMessage(initialMessage);
        await _supportRequestRepository.AddAsync(supportRequest, cancellationToken);

        return await GetByIdAsync(supportRequest.Id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<SupportRequestDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var supportRequests = await _supportRequestRepository.GetAllAsync(cancellationToken);
        return await MapCollectionAsync(supportRequests, cancellationToken);
    }

    public async Task<SupportRequestDto> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var supportRequest = await _supportRequestRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Support request not found.");

        EnsureCanAccess(supportRequest);
        return await MapAsync(supportRequest, cancellationToken);
    }

    public async Task<IReadOnlyCollection<SupportRequestDto>> GetMyAsync(CancellationToken cancellationToken)
    {
        var supportRequests = await _supportRequestRepository.GetByCustomerIdAsync(GetRequiredUserId(), cancellationToken);
        return await MapCollectionAsync(supportRequests, cancellationToken);
    }

    public async Task<SupportRequestDto> AddMessageAsync(Guid id, AddSupportRequestMessageDto request, CancellationToken cancellationToken)
    {
        var supportRequest = await _supportRequestRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Support request not found.");

        EnsureCanAccess(supportRequest);

        if (string.IsNullOrWhiteSpace(request.Message) && request.Attachments.Count == 0)
        {
            throw new InvalidOperationException("Message or at least one attachment is required.");
        }

        if (supportRequest.Status == SupportStatusCodes.Closed)
        {
            throw new InvalidOperationException("Closed support request cannot be updated.");
        }

        var userId = GetRequiredUserId();
        var role = GetRequiredUserRole();
        var message = CreateMessage(userId, role, request.Message ?? string.Empty, request.Attachments);
        await _supportRequestRepository.AddMessageAsync(id, message, cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<SupportRequestDto> UpdateStatusAsync(Guid id, UpdateSupportRequestStatusDto request, CancellationToken cancellationToken)
    {
        var supportRequest = await _supportRequestRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Support request not found.");

        if (!IsAdministrator())
        {
            throw new InvalidOperationException("Administrator access is required.");
        }

        var nextStatus = await GetRequiredStatusAsync(request.Status, cancellationToken);
        supportRequest.SetStatus(nextStatus.Id, nextStatus.Name);
        await _supportRequestRepository.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    private async Task<IReadOnlyCollection<SupportRequestDto>> MapCollectionAsync(
        IReadOnlyCollection<SupportRequest> supportRequests,
        CancellationToken cancellationToken)
    {
        if (supportRequests.Count == 0)
        {
            return [];
        }

        var userDirectory = await BuildUserDirectoryAsync(supportRequests, cancellationToken);
        return supportRequests.Select(request => Map(request, userDirectory)).ToArray();
    }

    private async Task<SupportRequestDto> MapAsync(SupportRequest supportRequest, CancellationToken cancellationToken)
    {
        var userDirectory = await BuildUserDirectoryAsync([supportRequest], cancellationToken);
        return Map(supportRequest, userDirectory);
    }

    private async Task<IReadOnlyDictionary<string, UserDirectoryDto>> BuildUserDirectoryAsync(
        IReadOnlyCollection<SupportRequest> supportRequests,
        CancellationToken cancellationToken)
    {
        var userIds = supportRequests
            .Select(request => request.CustomerId)
            .Concat(supportRequests.SelectMany(request => request.Messages.Select(message => message.AuthorUserId)))
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        return await _userDirectoryService.GetByIdsAsync(userIds, cancellationToken);
    }

    private static SupportRequestDto Map(
        SupportRequest supportRequest,
        IReadOnlyDictionary<string, UserDirectoryDto> userDirectory)
    {
        userDirectory.TryGetValue(supportRequest.CustomerId, out var customer);

        return new SupportRequestDto
        {
            Id = supportRequest.Id,
            CustomerId = supportRequest.CustomerId,
            CustomerFullName = customer?.FullName ?? string.Empty,
            CustomerEmail = customer?.Email ?? string.Empty,
            OrderId = supportRequest.OrderId,
            OrderNumber = supportRequest.Order?.OrderNumber,
            Subject = supportRequest.Subject,
            Status = supportRequest.Status,
            StatusReferenceId = supportRequest.SupportStatusReferenceId,
            CreatedAtUtc = supportRequest.CreatedAtUtc,
            UpdatedAtUtc = supportRequest.UpdatedAtUtc,
            ClosedAtUtc = supportRequest.ClosedAtUtc,
            Messages = supportRequest.Messages
                .OrderBy(message => message.CreatedAtUtc)
                .Select(message =>
                {
                    userDirectory.TryGetValue(message.AuthorUserId, out var author);

                    return new SupportRequestMessageDto
                    {
                        Id = message.Id,
                        AuthorUserId = message.AuthorUserId,
                        AuthorRole = message.AuthorRole,
                        AuthorFullName = author?.FullName ?? string.Empty,
                        AuthorEmail = author?.Email ?? string.Empty,
                        MessageText = message.MessageText,
                        CreatedAtUtc = message.CreatedAtUtc,
                        Attachments = message.Attachments
                            .OrderBy(attachment => attachment.CreatedAtUtc)
                            .Select(attachment => new SupportRequestAttachmentDto
                            {
                                Id = attachment.Id,
                                FileName = attachment.FileName,
                                FileUrl = attachment.FileUrl,
                                ContentType = attachment.ContentType,
                                CreatedAtUtc = attachment.CreatedAtUtc,
                            })
                            .ToArray(),
                    };
                })
                .ToArray(),
        };
    }

    private SupportRequestMessage CreateMessage(
        string userId,
        string role,
        string messageText,
        IReadOnlyCollection<CreateSupportAttachmentDto> attachments)
    {
        var normalizedText = messageText.Trim();
        var message = new SupportRequestMessage(userId, role, normalizedText);

        foreach (var attachment in attachments)
        {
            message.AddAttachment(new SupportRequestAttachment(
                attachment.FileName,
                attachment.FileUrl,
                attachment.ContentType));
        }

        return message;
    }

    private void EnsureCanAccess(SupportRequest supportRequest)
    {
        if (IsAdministrator())
        {
            return;
        }

        if (supportRequest.CustomerId != GetRequiredUserId())
        {
            throw new InvalidOperationException("Access to support request is denied.");
        }
    }

    private async Task<SupportStatusReference> GetRequiredStatusAsync(string status, CancellationToken cancellationToken)
    {
        return await _supportStatusReferenceRepository.GetByNameAsync(status.Trim(), cancellationToken)
            ?? throw new InvalidOperationException("Support request status not found.");
    }

    private bool IsAdministrator() => string.Equals(_currentUserService.Role, "Administrator", StringComparison.Ordinal);

    private string GetRequiredUserId()
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            throw new InvalidOperationException("Authenticated user is required.");
        }

        return _currentUserService.UserId;
    }

    private string GetRequiredUserRole()
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.Role))
        {
            throw new InvalidOperationException("Authenticated user role is required.");
        }

        return _currentUserService.Role;
    }
}
