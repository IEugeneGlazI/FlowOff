using Flowoff.Application.DTOs.Support;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SupportRequestsController : ControllerBase
{
    private static readonly HashSet<string> AllowedAttachmentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".pdf"
    };

    private const long MaxAttachmentSizeInBytes = 10 * 1024 * 1024;
    private const int MaxAttachmentsPerMessage = 5;
    private readonly ISupportRequestService _supportRequestService;
    private readonly IWebHostEnvironment _environment;

    public SupportRequestsController(ISupportRequestService supportRequestService, IWebHostEnvironment environment)
    {
        _supportRequestService = supportRequestService;
        _environment = environment;
    }

    [HttpGet("my")]
    [Authorize(Roles = nameof(UserRole.Customer))]
    [ProducesResponseType(typeof(IReadOnlyCollection<SupportRequestDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<SupportRequestDto>>> GetMy(CancellationToken cancellationToken)
    {
        return Ok(await _supportRequestService.GetMyAsync(cancellationToken));
    }

    [HttpGet]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    [ProducesResponseType(typeof(IReadOnlyCollection<SupportRequestDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<SupportRequestDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _supportRequestService.GetAllAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Customer) + "," + nameof(UserRole.Administrator))]
    [ProducesResponseType(typeof(SupportRequestDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SupportRequestDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _supportRequestService.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Customer))]
    [ProducesResponseType(typeof(SupportRequestDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<SupportRequestDto>> Create(
        [FromForm] CreateSupportRequestFormRequest request,
        CancellationToken cancellationToken)
    {
        var attachments = await SaveAttachmentsAsync(request.Files, cancellationToken);
        var created = await _supportRequestService.CreateAsync(
            new CreateSupportRequestDto
            {
                Subject = request.Subject,
                OrderId = request.OrderId,
                Message = request.Message,
                Attachments = attachments,
            },
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPost("{id:guid}/messages")]
    [Authorize(Roles = nameof(UserRole.Customer) + "," + nameof(UserRole.Administrator))]
    [ProducesResponseType(typeof(SupportRequestDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SupportRequestDto>> AddMessage(
        Guid id,
        [FromForm] AddSupportRequestMessageFormRequest request,
        CancellationToken cancellationToken)
    {
        var attachments = await SaveAttachmentsAsync(request.Files, cancellationToken);
        return Ok(await _supportRequestService.AddMessageAsync(
            id,
            new AddSupportRequestMessageDto
            {
                Message = request.Message,
                Attachments = attachments,
            },
            cancellationToken));
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    [ProducesResponseType(typeof(SupportRequestDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SupportRequestDto>> UpdateStatus(
        Guid id,
        UpdateSupportRequestStatusDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _supportRequestService.UpdateStatusAsync(id, request, cancellationToken));
    }

    private async Task<IReadOnlyCollection<CreateSupportAttachmentDto>> SaveAttachmentsAsync(
        IReadOnlyCollection<IFormFile>? files,
        CancellationToken cancellationToken)
    {
        if (files is null || files.Count == 0)
        {
            return [];
        }

        if (files.Count > MaxAttachmentsPerMessage)
        {
            throw new InvalidOperationException("Too many attachments in one message.");
        }

        var webRootPath = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
        }

        var uploadsDirectory = Path.Combine(webRootPath, "uploads", "support");
        Directory.CreateDirectory(uploadsDirectory);

        var attachments = new List<CreateSupportAttachmentDto>(files.Count);

        foreach (var file in files)
        {
            if (file.Length == 0)
            {
                throw new InvalidOperationException("Attachment file is empty.");
            }

            if (file.Length > MaxAttachmentSizeInBytes)
            {
                throw new InvalidOperationException("Attachment size must not exceed 10 MB.");
            }

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(extension) || !AllowedAttachmentExtensions.Contains(extension))
            {
                throw new InvalidOperationException("Only JPG, PNG, WEBP and PDF attachments are allowed.");
            }

            var safeFileName = Path.GetFileName(file.FileName);
            var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var filePath = Path.Combine(uploadsDirectory, storedFileName);

            await using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            attachments.Add(new CreateSupportAttachmentDto
            {
                FileName = safeFileName,
                FileUrl = $"{Request.Scheme}://{Request.Host}/uploads/support/{storedFileName}",
                ContentType = file.ContentType,
            });
        }

        return attachments;
    }

    public sealed class CreateSupportRequestFormRequest
    {
        [FromForm(Name = "subject")]
        public string Subject { get; init; } = string.Empty;

        [FromForm(Name = "orderId")]
        public Guid? OrderId { get; init; }

        [FromForm(Name = "message")]
        public string? Message { get; init; }

        [FromForm(Name = "files")]
        public List<IFormFile> Files { get; init; } = [];
    }

    public sealed class AddSupportRequestMessageFormRequest
    {
        [FromForm(Name = "message")]
        public string? Message { get; init; }

        [FromForm(Name = "files")]
        public List<IFormFile> Files { get; init; } = [];
    }
}
