using Flowoff.Domain.Entities;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Seed;

public static class CatalogSeed
{
    public static async Task SeedAsync(FlowoffDbContext dbContext)
    {
        await EnsureCategoriesAsync(dbContext);
        await EnsureFlowerInsAsync(dbContext);
        await EnsureColorsAsync(dbContext);
    }

    private static async Task<Dictionary<string, Category>> EnsureCategoriesAsync(FlowoffDbContext dbContext)
    {
        var existing = await dbContext.Categories.ToDictionaryAsync(item => item.Name, CancellationToken.None);

        Category GetOrCreate(string name)
        {
            if (existing.TryGetValue(name, out var category))
            {
                return category;
            }

            category = new Category(name);
            existing[name] = category;
            dbContext.Categories.Add(category);
            return category;
        }

        GetOrCreate("Шары");
        GetOrCreate("Сладости");
        GetOrCreate("Продуктовые корзины");
        GetOrCreate("Фруктовые корзины");
        GetOrCreate("Мягкие игрушки");
        GetOrCreate("Вазы");
        GetOrCreate("Свечи");

        await dbContext.SaveChangesAsync();
        return existing;
    }

    private static async Task<Dictionary<string, FlowerIn>> EnsureFlowerInsAsync(FlowoffDbContext dbContext)
    {
        var existing = await dbContext.FlowerIns.ToDictionaryAsync(item => item.Name, CancellationToken.None);

        FlowerIn GetOrCreate(string name)
        {
            if (existing.TryGetValue(name, out var flowerIn))
            {
                return flowerIn;
            }

            flowerIn = new FlowerIn(name);
            existing[name] = flowerIn;
            dbContext.FlowerIns.Add(flowerIn);
            return flowerIn;
        }

        GetOrCreate("Роза");
        GetOrCreate("Пион");
        GetOrCreate("Тюльпан");
        GetOrCreate("Хризантема");
        GetOrCreate("Лилия");
        GetOrCreate("Гербера");
        GetOrCreate("Орхидея");
        GetOrCreate("Гвоздика");
        GetOrCreate("Эустома");
        GetOrCreate("Маттиола");

        await dbContext.SaveChangesAsync();
        return existing;
    }

    private static async Task<Dictionary<string, Color>> EnsureColorsAsync(FlowoffDbContext dbContext)
    {
        var existing = await dbContext.Colors.ToDictionaryAsync(item => item.Name, CancellationToken.None);

        Color GetOrCreate(string name)
        {
            if (existing.TryGetValue(name, out var color))
            {
                return color;
            }

            color = new Color(name);
            existing[name] = color;
            dbContext.Colors.Add(color);
            return color;
        }

        GetOrCreate("Красный");
        GetOrCreate("Белый");
        GetOrCreate("Розовый");
        GetOrCreate("Желтый");
        GetOrCreate("Сиреневый");
        GetOrCreate("Кремовый");
        GetOrCreate("Зеленый");
        GetOrCreate("Оранжевый");
        GetOrCreate("Бордовый");
        GetOrCreate("Голубой");

        await dbContext.SaveChangesAsync();
        return existing;
    }
}
