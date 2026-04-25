using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Seed;

public static class CatalogSeed
{
    public static async Task SeedAsync(FlowoffDbContext dbContext)
    {
        if (await dbContext.Categories.AnyAsync())
        {
            return;
        }

        var flowers = new Category("Flowers", "Single flowers for custom bouquets.");
        var bouquets = new Category("Bouquets", "Ready-made bouquet compositions.");

        await dbContext.Categories.AddRangeAsync(flowers, bouquets);

        await dbContext.Products.AddRangeAsync(
            new Product("Red Rose", "Classic red rose.", 180m, 150, ProductType.Flower, flowers.Id),
            new Product("White Tulip", "Fresh white tulip.", 120m, 200, ProductType.Flower, flowers.Id),
            new Product("Spring Melody", "Bouquet with tulips and greenery.", 2300m, 12, ProductType.Bouquet, bouquets.Id, true),
            new Product("Pink Cloud", "Showcase bouquet in soft pink tones.", 3100m, 8, ProductType.Bouquet, bouquets.Id, true));

        await dbContext.SaveChangesAsync();
    }
}
