using Flowoff.Domain.Enums;
using Flowoff.Infrastructure.Repositories;
using Flowoff.Infrastructure.Tests.TestHelpers;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Tests.Repositories;

public class ProductRepositoryTests : IDisposable
{
    private readonly SqliteFlowoffDbContextFactory _dbFactory = new();

    [Fact]
    public async Task GetAllAsync_ShouldReturnOnlyVisibleProducts_WhenIncludeHiddenIsFalse()
    {
        await using var context = _dbFactory.CreateDbContext();
        var color = TestDataFactory.CreateColor("Красный");
        var flowerIn = TestDataFactory.CreateFlowerIn("Роза");
        var category = TestDataFactory.CreateCategory("Подарки");
        var visibleBouquet = TestDataFactory.CreateBouquet("Альфа", 1000m, flowerIn.Id, color.Id, true);
        var hiddenBouquet = TestDataFactory.CreateBouquet("Бета", 1200m, flowerIn.Id, color.Id, false);
        var visibleFlower = TestDataFactory.CreateFlower("Гамма", 300m, flowerIn.Id, color.Id, true);
        var hiddenGift = TestDataFactory.CreateGift("Дельта", 700m, category.Id, false);

        context.Colors.Add(color);
        context.FlowerIns.Add(flowerIn);
        context.Categories.Add(category);
        context.Bouquets.AddRange(visibleBouquet, hiddenBouquet);
        context.Flowers.Add(visibleFlower);
        context.Gifts.Add(hiddenGift);
        await context.SaveChangesAsync();

        var repository = new ProductRepository(context);

        var result = await repository.GetAllAsync(null, null, null, null, includeHidden: false, CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.DoesNotContain(result, product => product.Name == "Бета" || product.Name == "Дельта");
    }

    [Fact]
    public async Task GetAllAsync_ShouldFilterFlowersByColor_AndSortByName()
    {
        await using var context = _dbFactory.CreateDbContext();
        var red = TestDataFactory.CreateColor("Красный");
        var white = TestDataFactory.CreateColor("Белый");
        var rose = TestDataFactory.CreateFlowerIn("Роза");
        var first = TestDataFactory.CreateFlower("Б", 350m, rose.Id, red.Id);
        var second = TestDataFactory.CreateFlower("А", 360m, rose.Id, red.Id);
        var ignored = TestDataFactory.CreateFlower("В", 370m, rose.Id, white.Id);

        context.Colors.AddRange(red, white);
        context.FlowerIns.Add(rose);
        context.Flowers.AddRange(first, second, ignored);
        await context.SaveChangesAsync();

        var repository = new ProductRepository(context);

        var result = await repository.GetAllAsync(ProductType.Flower, null, red.Id, null, includeHidden: true, CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.Collection(
            result,
            product => Assert.Equal("А", product.Name),
            product => Assert.Equal("Б", product.Name));
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnHiddenProduct_WhenIncludeHiddenIsTrue()
    {
        await using var context = _dbFactory.CreateDbContext();
        var category = TestDataFactory.CreateCategory("Игрушки");
        var hiddenGift = TestDataFactory.CreateGift("Мишка", 900m, category.Id, false);

        context.Categories.Add(category);
        context.Gifts.Add(hiddenGift);
        await context.SaveChangesAsync();

        var repository = new ProductRepository(context);

        var hiddenExcluded = await repository.GetByIdAsync(hiddenGift.Id, CancellationToken.None, includeHidden: false);
        var hiddenIncluded = await repository.GetByIdAsync(hiddenGift.Id, CancellationToken.None, includeHidden: true);

        Assert.Null(hiddenExcluded);
        Assert.NotNull(hiddenIncluded);
        Assert.Equal("Мишка", hiddenIncluded!.Name);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldLoadBouquetNavigationProperties()
    {
        await using var context = _dbFactory.CreateDbContext();
        var color = TestDataFactory.CreateColor("Синий");
        var flowerIn = TestDataFactory.CreateFlowerIn("Гортензия");
        var bouquet = TestDataFactory.CreateBouquet("Лагуна", 2500m, flowerIn.Id, color.Id);

        context.Colors.Add(color);
        context.FlowerIns.Add(flowerIn);
        context.Bouquets.Add(bouquet);
        await context.SaveChangesAsync();

        var repository = new ProductRepository(context);

        var result = await repository.GetByIdAsync(bouquet.Id, CancellationToken.None, includeHidden: true, asTracking: false);

        var loadedBouquet = Assert.IsType<Flowoff.Domain.Entities.Bouquet>(result);
        Assert.Single(loadedBouquet.FlowerIns);
        Assert.Single(loadedBouquet.Colors);
        Assert.NotNull(loadedBouquet.FlowerIns.Single().FlowerIn);
        Assert.NotNull(loadedBouquet.Colors.Single().Color);
    }

    [Fact]
    public async Task CategoryExistsAsync_ShouldIgnoreSoftDeletedCategories()
    {
        await using var context = _dbFactory.CreateDbContext();
        var activeCategory = TestDataFactory.CreateCategory("Открытки");
        var deletedCategory = TestDataFactory.CreateCategory("Шары");
        deletedCategory.SoftDelete();

        context.Categories.AddRange(activeCategory, deletedCategory);
        await context.SaveChangesAsync();

        var repository = new ProductRepository(context);

        Assert.True(await repository.CategoryExistsAsync(activeCategory.Id, CancellationToken.None));
        Assert.False(await repository.CategoryExistsAsync(deletedCategory.Id, CancellationToken.None));
    }

    [Fact]
    public async Task GetAllAsync_ShouldFilterBouquetsByFlowerIn()
    {
        await using var context = _dbFactory.CreateDbContext();
        var color = TestDataFactory.CreateColor("Желтый");
        var rose = TestDataFactory.CreateFlowerIn("Роза");
        var tulip = TestDataFactory.CreateFlowerIn("Тюльпан");
        var matchingBouquet = TestDataFactory.CreateBouquet("Солнце", 1600m, rose.Id, color.Id, true);
        var otherBouquet = TestDataFactory.CreateBouquet("Рассвет", 1700m, tulip.Id, color.Id, true);

        context.Colors.Add(color);
        context.FlowerIns.AddRange(rose, tulip);
        context.Bouquets.AddRange(matchingBouquet, otherBouquet);
        await context.SaveChangesAsync();

        var repository = new ProductRepository(context);

        var result = await repository.GetAllAsync(ProductType.Bouquet, null, null, rose.Id, includeHidden: true, CancellationToken.None);

        Assert.Single(result);
        Assert.Equal("Солнце", result.Single().Name);
    }

    [Fact]
    public async Task ColorExistsAsync_ShouldReturnFalse_ForSoftDeletedColor()
    {
        await using var context = _dbFactory.CreateDbContext();
        var activeColor = TestDataFactory.CreateColor("Лайм");
        var deletedColor = TestDataFactory.CreateColor("Серебро");
        deletedColor.SoftDelete();

        context.Colors.AddRange(activeColor, deletedColor);
        await context.SaveChangesAsync();

        var repository = new ProductRepository(context);

        Assert.True(await repository.ColorExistsAsync(activeColor.Id, CancellationToken.None));
        Assert.False(await repository.ColorExistsAsync(deletedColor.Id, CancellationToken.None));
    }

    public void Dispose()
    {
        _dbFactory.Dispose();
    }
}
