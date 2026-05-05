using Flowoff.Application.DTOs.Products;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    private const long MaxImageSizeInBytes = 5 * 1024 * 1024;
    private readonly IProductService _productService;
    private readonly IWebHostEnvironment _environment;

    public ProductsController(IProductService productService, IWebHostEnvironment environment)
    {
        _productService = productService;
        _environment = environment;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyCollection<ProductDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<ProductDto>>> GetCatalog(
        [FromQuery] ProductType? type,
        [FromQuery] Guid? categoryId,
        [FromQuery] Guid? colorId,
        [FromQuery] Guid? flowerInId,
        [FromQuery] bool includeHidden,
        CancellationToken cancellationToken)
    {
        if (includeHidden && !(User.Identity?.IsAuthenticated == true
            && (User.IsInRole(nameof(UserRole.Florist)) || User.IsInRole(nameof(UserRole.Administrator)))))
        {
            return Forbid();
        }

        var result = await _productService.GetCatalogAsync(
            new ProductFilterDto
            {
                Type = type,
                CategoryId = categoryId,
                ColorId = colorId,
                FlowerInId = flowerInId
            },
            cancellationToken,
            includeHidden);

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var product = await _productService.GetByIdAsync(id, cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Florist) + "," + nameof(UserRole.Administrator))]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ProductDto>> Create(CreateProductRequestDto request, CancellationToken cancellationToken)
    {
        var createdProduct = await _productService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = createdProduct.Id }, createdProduct);
    }

    [HttpPost("upload-image")]
    [Authorize(Roles = nameof(UserRole.Florist) + "," + nameof(UserRole.Administrator))]
    [ProducesResponseType(typeof(UploadProductImageResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UploadProductImageResponseDto>> UploadImage(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
        {
            return BadRequest(new { error = "Файл изображения пустой." });
        }

        if (file.Length > MaxImageSizeInBytes)
        {
            return BadRequest(new { error = "Размер изображения не должен превышать 5 МБ." });
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedImageExtensions.Contains(extension))
        {
            return BadRequest(new { error = "Разрешены только изображения JPG, PNG и WEBP." });
        }

        var webRootPath = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
        }

        var uploadsDirectory = Path.Combine(webRootPath, "uploads", "products");
        Directory.CreateDirectory(uploadsDirectory);

        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(uploadsDirectory, fileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/products/{fileName}";
        return Ok(new UploadProductImageResponseDto(imageUrl));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Florist) + "," + nameof(UserRole.Administrator))]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProductDto>> Update(Guid id, UpdateProductRequestDto request, CancellationToken cancellationToken)
    {
        var existingProduct = await _productService.GetByIdAsync(id, cancellationToken, includeHidden: true);
        if (existingProduct is null)
        {
            return NotFound();
        }

        var updatedProduct = await _productService.UpdateAsync(id, request, cancellationToken);

        if (!string.Equals(existingProduct.ImageUrl, updatedProduct.ImageUrl, StringComparison.OrdinalIgnoreCase))
        {
            TryDeleteLocalProductImage(existingProduct.ImageUrl);
        }

        return Ok(updatedProduct);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Florist) + "," + nameof(UserRole.Administrator))]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var existingProduct = await _productService.GetByIdAsync(id, cancellationToken, includeHidden: true);
        if (existingProduct is null)
        {
            return NotFound();
        }

        await _productService.DeleteAsync(id, cancellationToken);
        TryDeleteLocalProductImage(existingProduct.ImageUrl);
        return NoContent();
    }

    private void TryDeleteLocalProductImage(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return;
        }

        var relativePath = TryGetLocalImagePath(imageUrl);
        if (relativePath is null)
        {
            return;
        }

        var webRootPath = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
        }

        var uploadsRoot = Path.GetFullPath(Path.Combine(webRootPath, "uploads", "products"));
        var filePath = Path.GetFullPath(Path.Combine(webRootPath, relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)));

        if (!filePath.StartsWith(uploadsRoot, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }
    }

    private static string? TryGetLocalImagePath(string imageUrl)
    {
        if (Uri.TryCreate(imageUrl, UriKind.Absolute, out var absoluteUri))
        {
            return absoluteUri.AbsolutePath.StartsWith("/uploads/products/", StringComparison.OrdinalIgnoreCase)
                ? absoluteUri.AbsolutePath
                : null;
        }

        return imageUrl.StartsWith("/uploads/products/", StringComparison.OrdinalIgnoreCase)
            ? imageUrl
            : null;
    }

    public sealed record UploadProductImageResponseDto(string ImageUrl);
}
