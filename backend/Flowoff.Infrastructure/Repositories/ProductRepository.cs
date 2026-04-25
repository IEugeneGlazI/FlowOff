using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly FlowoffDbContext _dbContext;

    public ProductRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Product product, CancellationToken cancellationToken)
    {
        await _dbContext.Products.AddAsync(product, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<Product>> GetAllAsync(ProductType? type, Guid? categoryId, CancellationToken cancellationToken)
    {
        IQueryable<Product> query = _dbContext.Products
            .AsNoTracking()
            .Include(product => product.Category);

        if (type.HasValue)
        {
            query = query.Where(product => product.Type == type.Value);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(product => product.CategoryId == categoryId.Value);
        }

        return await query.OrderBy(product => product.Name).ToArrayAsync(cancellationToken);
    }

    public Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.Products
            .Include(product => product.Category)
            .FirstOrDefaultAsync(product => product.Id == id, cancellationToken);
    }
}
