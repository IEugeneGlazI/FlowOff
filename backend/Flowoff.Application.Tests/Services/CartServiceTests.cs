using Flowoff.Application.DTOs.Cart;
using Flowoff.Application.Interfaces;
using Flowoff.Application.Services;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Repositories;
using Moq;

namespace Flowoff.Application.Tests.Services;

public class CartServiceTests
{
    [Fact]
    public async Task AddItemAsync_ShouldReturnMappedCart_WhenProductIsVisible()
    {
        var currentUser = CreateCurrentUserMock(isAuthenticated: true, userId: "customer-1");
        var cartRepository = new Mock<ICartRepository>();
        var productRepository = new Mock<IProductRepository>();
        var product = CreateBouquet(price: 1250m);
        var cart = new Cart("customer-1");
        cart.AddItem(product, 2);

        productRepository
            .Setup(repository => repository.GetByIdAsync(product.Id, It.IsAny<CancellationToken>(), true, false))
            .ReturnsAsync(product);
        cartRepository
            .Setup(repository => repository.AddItemAsync("customer-1", product, 2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        var service = new CartService(cartRepository.Object, productRepository.Object, currentUser.Object);

        var result = await service.AddItemAsync(new AddCartItemRequestDto
        {
            ProductId = product.Id,
            Quantity = 2
        }, CancellationToken.None);

        Assert.Equal("customer-1", result.CustomerId);
        Assert.Equal(2500m, result.TotalAmount);
        Assert.Single(result.Items);
        Assert.Equal(product.Name, result.Items.Single().ProductName);
        Assert.Equal(product.Type.ToString(), result.Items.Single().ProductType);
        Assert.Equal(2, result.Items.Single().Quantity);
    }

    [Fact]
    public async Task AddItemAsync_ShouldThrow_WhenProductIsHidden()
    {
        var currentUser = CreateCurrentUserMock(isAuthenticated: true, userId: "customer-1");
        var cartRepository = new Mock<ICartRepository>();
        var productRepository = new Mock<IProductRepository>();
        var product = CreateBouquet(isVisible: false);

        productRepository
            .Setup(repository => repository.GetByIdAsync(product.Id, It.IsAny<CancellationToken>(), true, false))
            .ReturnsAsync(product);

        var service = new CartService(cartRepository.Object, productRepository.Object, currentUser.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.AddItemAsync(new AddCartItemRequestDto
        {
            ProductId = product.Id,
            Quantity = 1
        }, CancellationToken.None));
    }

    [Fact]
    public async Task GetMyCartAsync_ShouldReturnEmptyCart_WhenCartDoesNotExist()
    {
        var currentUser = CreateCurrentUserMock(isAuthenticated: true, userId: "customer-1");
        var cartRepository = new Mock<ICartRepository>();
        var productRepository = new Mock<IProductRepository>();

        cartRepository
            .Setup(repository => repository.GetByCustomerIdAsync("customer-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        var service = new CartService(cartRepository.Object, productRepository.Object, currentUser.Object);

        var result = await service.GetMyCartAsync(CancellationToken.None);

        Assert.Equal(Guid.Empty, result.Id);
        Assert.Equal("customer-1", result.CustomerId);
        Assert.Equal(0m, result.TotalAmount);
        Assert.Empty(result.Items);
    }

    [Fact]
    public async Task UpdateItemAsync_ShouldSaveChanges_AndReturnUpdatedCart()
    {
        var currentUser = CreateCurrentUserMock(isAuthenticated: true, userId: "customer-1");
        var cartRepository = new Mock<ICartRepository>();
        var productRepository = new Mock<IProductRepository>();
        var product = CreateBouquet(price: 500m);
        var cart = new Cart("customer-1");
        cart.AddItem(product, 1);

        cartRepository
            .Setup(repository => repository.GetOrCreateAsync("customer-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);
        productRepository
            .Setup(repository => repository.GetByIdAsync(product.Id, It.IsAny<CancellationToken>(), true, false))
            .ReturnsAsync(product);

        var service = new CartService(cartRepository.Object, productRepository.Object, currentUser.Object);

        var result = await service.UpdateItemAsync(new UpdateCartItemRequestDto
        {
            ProductId = product.Id,
            Quantity = 3
        }, CancellationToken.None);

        Assert.Single(result.Items);
        Assert.Equal(3, result.Items.Single().Quantity);
        Assert.Equal(1500m, result.TotalAmount);
        cartRepository.Verify(repository => repository.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetMyCartAsync_ShouldSkipMissingProducts_WhenMappingCart()
    {
        var currentUser = CreateCurrentUserMock(isAuthenticated: true, userId: "customer-1");
        var cartRepository = new Mock<ICartRepository>();
        var productRepository = new Mock<IProductRepository>();
        var existingProduct = CreateBouquet(price: 400m);
        var missingProduct = CreateBouquet(price: 900m);
        var cart = new Cart("customer-1");
        cart.AddItem(existingProduct, 2);
        cart.AddItem(missingProduct, 1);

        cartRepository
            .Setup(repository => repository.GetByCustomerIdAsync("customer-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);
        productRepository
            .Setup(repository => repository.GetByIdAsync(existingProduct.Id, It.IsAny<CancellationToken>(), true, false))
            .ReturnsAsync(existingProduct);
        productRepository
            .Setup(repository => repository.GetByIdAsync(missingProduct.Id, It.IsAny<CancellationToken>(), true, false))
            .ReturnsAsync((Bouquet?)null);

        var service = new CartService(cartRepository.Object, productRepository.Object, currentUser.Object);

        var result = await service.GetMyCartAsync(CancellationToken.None);

        Assert.Single(result.Items);
        Assert.Equal(existingProduct.Id, result.Items.Single().ProductId);
        Assert.Equal(800m, result.TotalAmount);
    }

    [Fact]
    public async Task ClearAsync_ShouldRemoveAllItems_AndSaveChanges()
    {
        var currentUser = CreateCurrentUserMock(isAuthenticated: true, userId: "customer-1");
        var cartRepository = new Mock<ICartRepository>();
        var productRepository = new Mock<IProductRepository>();
        var product = CreateBouquet(price: 600m);
        var cart = new Cart("customer-1");
        cart.AddItem(product, 2);

        cartRepository
            .Setup(repository => repository.GetOrCreateAsync("customer-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        var service = new CartService(cartRepository.Object, productRepository.Object, currentUser.Object);

        await service.ClearAsync(CancellationToken.None);

        Assert.Empty(cart.Items);
        cartRepository.Verify(repository => repository.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private static Mock<ICurrentUserService> CreateCurrentUserMock(bool isAuthenticated, string? userId)
    {
        var mock = new Mock<ICurrentUserService>();
        mock.SetupGet(service => service.IsAuthenticated).Returns(isAuthenticated);
        mock.SetupGet(service => service.UserId).Returns(userId);
        return mock;
    }

    private static Bouquet CreateBouquet(decimal price = 1000m, bool isVisible = true)
    {
        return new Bouquet(
            "Тестовый букет",
            "Описание",
            "/images/bouquet.jpg",
            price,
            [Guid.NewGuid()],
            [Guid.NewGuid()],
            isVisible);
    }
}
