using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class SupportRequestMessage : Entity
{
    public Guid SupportRequestId { get; private set; }
    public SupportRequest? SupportRequest { get; private set; }
    public string AuthorUserId { get; private set; } = string.Empty;
    public string AuthorRole { get; private set; } = string.Empty;
    public string MessageText { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public ICollection<SupportRequestAttachment> Attachments { get; private set; } = [];

    private SupportRequestMessage()
    {
    }

    public SupportRequestMessage(string authorUserId, string authorRole, string messageText)
    {
        AuthorUserId = authorUserId;
        AuthorRole = authorRole;
        MessageText = messageText;
    }

    public void AddAttachment(SupportRequestAttachment attachment)
    {
        Attachments.Add(attachment);
    }

    public void AttachToRequest(Guid supportRequestId)
    {
        SupportRequestId = supportRequestId;
    }
}
