using Flowoff.Domain.Common;

namespace Flowoff.Domain.Entities;

public class SupportRequestAttachment : Entity
{
    public Guid SupportRequestMessageId { get; private set; }
    public SupportRequestMessage? SupportRequestMessage { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string FileUrl { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private SupportRequestAttachment()
    {
    }

    public SupportRequestAttachment(string fileName, string fileUrl, string contentType)
    {
        FileName = fileName;
        FileUrl = fileUrl;
        ContentType = contentType;
    }
}
