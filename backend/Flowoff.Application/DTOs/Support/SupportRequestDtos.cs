using System.ComponentModel.DataAnnotations;

namespace Flowoff.Application.DTOs.Support;

public sealed class CreateSupportAttachmentDto
{
    public string FileName { get; init; } = string.Empty;
    public string FileUrl { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
}

public sealed class CreateSupportRequestDto
{
    [Required]
    [MaxLength(200)]
    public string Subject { get; init; } = string.Empty;

    public Guid? OrderId { get; init; }

    [MaxLength(4000)]
    public string? Message { get; init; }

    public IReadOnlyCollection<CreateSupportAttachmentDto> Attachments { get; init; } = [];
}

public sealed class AddSupportRequestMessageDto
{
    [MaxLength(4000)]
    public string? Message { get; init; }

    public IReadOnlyCollection<CreateSupportAttachmentDto> Attachments { get; init; } = [];
}

public sealed class UpdateSupportRequestStatusDto
{
    [Required]
    public string Status { get; init; } = string.Empty;
}

public sealed class SupportRequestAttachmentDto
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string FileUrl { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public DateTime CreatedAtUtc { get; init; }
}

public sealed class SupportRequestMessageDto
{
    public Guid Id { get; init; }
    public string AuthorUserId { get; init; } = string.Empty;
    public string AuthorRole { get; init; } = string.Empty;
    public string AuthorFullName { get; init; } = string.Empty;
    public string AuthorEmail { get; init; } = string.Empty;
    public string MessageText { get; init; } = string.Empty;
    public DateTime CreatedAtUtc { get; init; }
    public IReadOnlyCollection<SupportRequestAttachmentDto> Attachments { get; init; } = [];
}

public sealed class SupportRequestDto
{
    public Guid Id { get; init; }
    public string CustomerId { get; init; } = string.Empty;
    public string CustomerFullName { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public Guid? OrderId { get; init; }
    public int? OrderNumber { get; init; }
    public string Subject { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public Guid StatusReferenceId { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime UpdatedAtUtc { get; init; }
    public DateTime? ClosedAtUtc { get; init; }
    public IReadOnlyCollection<SupportRequestMessageDto> Messages { get; init; } = [];
}
