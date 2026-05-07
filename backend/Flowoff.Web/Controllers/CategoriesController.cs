using Flowoff.Domain.Repositories;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flowoff.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoriesController(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var categories = await _categoryRepository.GetAllAsync(cancellationToken);
        var response = categories.Select(category => new
        {
            category.Id,
            category.Name,
            category.Description
        });

        return Ok(response);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    public async Task<IActionResult> Create(CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = new Flowoff.Domain.Entities.Category(request.Name.Trim(), string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim());
        await _categoryRepository.AddAsync(category, cancellationToken);
        await _categoryRepository.SaveChangesAsync(cancellationToken);
        return Ok(new { category.Id, category.Name, category.Description });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    public async Task<IActionResult> Update(Guid id, UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return NotFound();
        }

        category.Update(request.Name.Trim(), string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim());
        await _categoryRepository.SaveChangesAsync(cancellationToken);
        return Ok(new { category.Id, category.Name, category.Description });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Administrator))]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return NotFound();
        }

        category.SoftDelete();
        await _categoryRepository.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    public sealed record CreateCategoryRequest(string Name, string? Description);
    public sealed record UpdateCategoryRequest(string Name, string? Description);
}
