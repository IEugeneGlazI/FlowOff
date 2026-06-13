using Flowoff.Infrastructure.Repositories;
using Flowoff.Infrastructure.Tests.TestHelpers;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Tests.Repositories;

public class CartRepositoryTests : IDisposable
{
    private readonly SqliteFlowoffDbContextFactory _dbFactory = new();

    [Fact]
    public async Task GetOrCreateAsync_ShouldCreateCart_WhenCartDoesNotExist()
    {
        await using var context = _dbFactory.CreateDbContext();
        context.Users.Add(TestDataFactory.CreateUser("customer-1", "customer1@test.local", Domain.Enums.UserRole.Customer));
        await context.SaveChangesAsync();

        var repository = new CartRepository(context);

        var cart = await repository.GetOrCreateAsync("customer-1", CancellationToken.None);

        Assert.Equal("customer-1", cart.CustomerId);
        Assert.Empty(cart.Items);
        Assert.Equal(1, await context.Carts.CountAsync());
    }

    [Fact]
    public async Task AddItemAsync_ShouldCreateCartItem_WhenProductNotYetInCart()
    {
        await using var context = _dbFactory.CreateDbContext();
        var customer = TestDataFactory.CreateUser("customer-1", "customer1@test.local", Domain.Enums.UserRole.Customer);
        var color = TestDataFactory.CreateColor("Красный");
        var flowerIn = TestDataFactory.CreateFlowerIn("Роза");
        var bouquet = TestDataFactory.CreateBouquet("Романтика", 1500m, flowerIn.Id, color.Id);

        context.Users.Add(customer);
        context.Colors.Add(color);
        context.FlowerIns.Add(flowerIn);
        context.Bouquets.Add(bouquet);
        await context.SaveChangesAsync();

        var repository = new CartRepository(context);

        var cart = await repository.AddItemAsync("customer-1", bouquet, 2, CancellationToken.None);

        Assert.Single(cart.Items);
        Assert.Equal(2, cart.Items.Single().Quantity);
        Assert.Equal(bouquet.Id, cart.Items.Single().BouquetId);
    }

    [Fact]
    public async Task AddItemAsync_ShouldIncreaseQuantity_WhenSameProductAlreadyExists()
    {
        await using var context = _dbFactory.CreateDbContext();
        var customer = TestDataFactory.CreateUser("customer-1", "customer1@test.local", Domain.Enums.UserRole.Customer);
        var color = TestDataFactory.CreateColor("Белый");
        var flowerIn = TestDataFactory.CreateFlowerIn("Пион");
        var bouquet = TestDataFactory.CreateBouquet("Облако", 2200m, flowerIn.Id, color.Id);
        var cart = new Flowoff.Domain.Entities.Cart("customer-1");
        cart.AddItem(bouquet, 1);

        context.Users.Add(customer);
        context.Colors.Add(color);
        context.FlowerIns.Add(flowerIn);
        context.Bouquets.Add(bouquet);
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var repository = new CartRepository(context);

        var result = await repository.AddItemAsync("customer-1", bouquet, 3, CancellationToken.None);

        Assert.Single(result.Items);
        Assert.Equal(4, result.Items.Single().Quantity);
    }

    [Fact]
    public async Task GetByCustomerIdAsync_ShouldReturnCartWithItems()
    {
        await using var context = _dbFactory.CreateDbContext();
        var customer = TestDataFactory.CreateUser("customer-1", "customer1@test.local", Domain.Enums.UserRole.Customer);
        var color = TestDataFactory.CreateColor("Розовый");
        var flowerIn = TestDataFactory.CreateFlowerIn("Тюльпан");
        var bouquet = TestDataFactory.CreateBouquet("Весна", 1100m, flowerIn.Id, color.Id);
        var cart = new Flowoff.Domain.Entities.Cart("customer-1");
        cart.AddItem(bouquet, 2);

        context.Users.Add(customer);
        context.Colors.Add(color);
        context.FlowerIns.Add(flowerIn);
        context.Bouquets.Add(bouquet);
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var repository = new CartRepository(context);

        var result = await repository.GetByCustomerIdAsync("customer-1", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Single(result!.Items);
        Assert.Equal(2, result.Items.Single().Quantity);
    }

    public void Dispose()
    {
        _dbFactory.Dispose();
    }
}
