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
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyCollection<ProductDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<ProductDto>>> GetCatalog(
        [FromQuery] ProductType? type,
        [FromQuery] Guid? categoryId,
        [FromQuery] Guid? colorId,
        [FromQuery] Guid? flowerInId,
        CancellationToken cancellationToken)
    {
        var result = await _productService.GetCatalogAsync(
            new ProductFilterDto
            {
                Type = type,
                CategoryId = categoryId,
                ColorId = colorId,
                FlowerInId = flowerInId
            },
            cancellationToken);

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

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Florist) + "," + nameof(UserRole.Administrator))]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProductDto>> Update(Guid id, UpdateProductRequestDto request, CancellationToken cancellationToken)
    {
        return Ok(await _productService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Florist) + "," + nameof(UserRole.Administrator))]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _productService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
