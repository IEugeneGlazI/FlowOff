using Flowoff.Application.DTOs.Orders;
using Flowoff.Application.DTOs.Site;
using Flowoff.Application.DTOs.Users;
using Flowoff.Application.Interfaces;
using Flowoff.Application.Services;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;
using Flowoff.Domain.Statuses;
using Moq;

namespace Flowoff.Application.Tests.Services;

public class OrderServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldThrow_WhenDeliveryOrderUsesPayOnPickup()
    {
        var fixture = new OrderServiceFixture();
        fixture.CurrentUser.SetupGet(service => service.IsAuthenticated).Returns(true);
        fixture.CurrentUser.SetupGet(service => service.UserId).Returns("customer-1");

        var service = fixture.CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(new CreateOrderRequestDto
        {
            DeliveryMethod = DeliveryMethod.Delivery,
            DeliveryAddress = "г. Москва, ул. Пушкина, д. 1",
            PayOnPickup = true,
            Items = [new CreateOrderItemRequestDto { ProductId = Guid.NewGuid(), Quantity = 1 }]
        }, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_ShouldThrow_WhenUserIsNotAuthenticated()
    {
        var fixture = new OrderServiceFixture();
        fixture.CurrentUser.SetupGet(service => service.IsAuthenticated).Returns(false);
        fixture.CurrentUser.SetupGet(service => service.UserId).Returns((string?)null);

        var service = fixture.CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(new CreateOrderRequestDto
        {
            DeliveryMethod = DeliveryMethod.Pickup,
            Items = [new CreateOrderItemRequestDto { ProductId = Guid.NewGuid(), Quantity = 1 }]
        }, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_ShouldThrow_WhenDeliveryAddressIsMissing()
    {
        var fixture = new OrderServiceFixture();
        fixture.CurrentUser.SetupGet(service => service.IsAuthenticated).Returns(true);
        fixture.CurrentUser.SetupGet(service => service.UserId).Returns("customer-1");

        var service = fixture.CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(new CreateOrderRequestDto
        {
            DeliveryMethod = DeliveryMethod.Delivery,
            DeliveryAddress = " ",
            Items = [new CreateOrderItemRequestDto { ProductId = Guid.NewGuid(), Quantity = 1 }]
        }, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_ShouldUsePickupAddress_AndPendingCashPayment_ForPickupOrders()
    {
        var fixture = new OrderServiceFixture();
        var product = CreateBouquet(price: 2000m);
        fixture.CurrentUser.SetupGet(service => service.IsAuthenticated).Returns(true);
        fixture.CurrentUser.SetupGet(service => service.UserId).Returns("customer-1");
        fixture.ProductRepository
            .Setup(repository => repository.GetByIdAsync(product.Id, It.IsAny<CancellationToken>(), true, false))
            .ReturnsAsync(product);
        fixture.OrderRepository
            .Setup(repository => repository.GetNextOrderNumberAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1001);
        fixture.PromotionRepository
            .Setup(repository => repository.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<Promotion>());
        fixture.SiteContactSettingsService
            .Setup(service => service.GetAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SiteContactSettingsDto { Address = "г. Москва, ул. Цветочная, д. 5" });
        fixture.UserDirectoryService
            .Setup(service => service.GetByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, UserDirectoryDto>
            {
                ["customer-1"] = new() { Id = "customer-1", Email = "customer@example.com", FullName = "Иван Петров" }
            });
        SetupStatusLookups(fixture);

        Order? savedOrder = null;
        fixture.OrderRepository
            .Setup(repository => repository.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .Callback<Order, CancellationToken>((order, _) => savedOrder = order)
            .Returns(Task.CompletedTask);

        var service = fixture.CreateService();

        var result = await service.CreateAsync(new CreateOrderRequestDto
        {
            DeliveryMethod = DeliveryMethod.Pickup,
            PayOnPickup = true,
            Items = [new CreateOrderItemRequestDto { ProductId = product.Id, Quantity = 1 }]
        }, CancellationToken.None);

        Assert.NotNull(savedOrder);
        Assert.Equal("г. Москва, ул. Цветочная, д. 5", result.DeliveryAddress);
        Assert.Equal(PaymentStatusCodes.Pending, result.PaymentStatus);
        Assert.Equal("CashOnPickup", result.PaymentProvider);
        Assert.Equal(2000m, result.TotalAmount);
        Assert.Equal(OrderStatusCodes.Active, result.Status);
    }

    [Fact]
    public async Task CreateAsync_ShouldApplyBestPromotion_AndCreatePaidOnlinePayment()
    {
        var fixture = new OrderServiceFixture();
        var product = CreateBouquet(price: 1000m);
        var discount10 = new Promotion(
            "Promo 10",
            null,
            10m,
            DateTime.UtcNow.AddDays(-1),
            DateTime.UtcNow.AddDays(1),
            [product.Id],
            [],
            []);
        var discount25 = new Promotion(
            "Promo 25",
            null,
            25m,
            DateTime.UtcNow.AddDays(-1),
            DateTime.UtcNow.AddDays(1),
            [product.Id],
            [],
            []);

        fixture.CurrentUser.SetupGet(service => service.IsAuthenticated).Returns(true);
        fixture.CurrentUser.SetupGet(service => service.UserId).Returns("customer-1");
        fixture.ProductRepository
            .Setup(repository => repository.GetByIdAsync(product.Id, It.IsAny<CancellationToken>(), true, false))
            .ReturnsAsync(product);
        fixture.OrderRepository
            .Setup(repository => repository.GetNextOrderNumberAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1002);
        fixture.PromotionRepository
            .Setup(repository => repository.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([discount10, discount25]);
        fixture.UserDirectoryService
            .Setup(service => service.GetByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, UserDirectoryDto>
            {
                ["customer-1"] = new() { Id = "customer-1", Email = "customer@example.com", FullName = "Иван Петров" }
            });
        SetupStatusLookups(fixture);

        var service = fixture.CreateService();

        var result = await service.CreateAsync(new CreateOrderRequestDto
        {
            DeliveryMethod = DeliveryMethod.Delivery,
            DeliveryAddress = "г. Москва, ул. Садовая, д. 10",
            Items = [new CreateOrderItemRequestDto { ProductId = product.Id, Quantity = 2 }]
        }, CancellationToken.None);

        Assert.Equal(1500m, result.TotalAmount);
        Assert.Equal(PaymentStatusCodes.Paid, result.PaymentStatus);
        Assert.Equal("StubOnlinePayment", result.PaymentProvider);
        Assert.Equal(750m, result.Items.Single().UnitPrice);
        Assert.Equal(2, result.Items.Single().Quantity);
    }

    [Fact]
    public async Task UpdateAssemblyStatusAsync_ShouldAssignFlorist_AndNotifyForPickupReady()
    {
        var fixture = new OrderServiceFixture();
        var order = CreatePickupOrder();

        fixture.CurrentUser.SetupGet(service => service.IsAuthenticated).Returns(true);
        fixture.CurrentUser.SetupGet(service => service.UserId).Returns("florist-1");
        fixture.CurrentUser.SetupGet(service => service.Role).Returns(nameof(UserRole.Florist));
        fixture.OrderRepository
            .Setup(repository => repository.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        fixture.UserDirectoryService
            .Setup(service => service.GetByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, UserDirectoryDto>
            {
                ["customer-1"] = new() { Id = "customer-1", Email = "customer@example.com", FullName = "Иван Петров" },
                ["florist-1"] = new() { Id = "florist-1", Email = "florist@example.com", FullName = "Мария Флорист" }
            });
        SetupStatusLookups(fixture);

        var service = fixture.CreateService();

        var result = await service.UpdateAssemblyStatusAsync(order.Id, new UpdateAssemblyStatusRequestDto
        {
            Status = DeliveryStatusCodes.ReadyForPickup
        }, CancellationToken.None);

        Assert.Equal("florist-1", result.FloristId);
        Assert.Equal("Мария Флорист", result.FloristFullName);
        Assert.Equal(DeliveryStatusCodes.ReadyForPickup, result.DeliveryStatus);
        fixture.OrderRepository.Verify(repository => repository.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        fixture.OrderNotificationService.Verify(service => service.NotifyPickupReadyAsync(order, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAssemblyStatusAsync_ShouldThrow_WhenStatusIsNotFloristStatus()
    {
        var fixture = new OrderServiceFixture();
        var order = CreatePickupOrder();

        fixture.OrderRepository
            .Setup(repository => repository.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        var service = fixture.CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateAssemblyStatusAsync(order.Id, new UpdateAssemblyStatusRequestDto
        {
            Status = DeliveryStatusCodes.Delivered
        }, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateStatusByAdminAsync_ShouldCompleteOrder_AndMarkPendingPaymentAsPaid()
    {
        var fixture = new OrderServiceFixture();
        var order = CreateDeliveryOrderWithPendingPayment();

        fixture.OrderRepository
            .Setup(repository => repository.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        fixture.UserDirectoryService
            .Setup(service => service.GetByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, UserDirectoryDto>
            {
                ["customer-1"] = new() { Id = "customer-1", Email = "customer@example.com", FullName = "Иван Петров" }
            });
        SetupStatusLookups(fixture);

        var service = fixture.CreateService();

        var result = await service.UpdateStatusByAdminAsync(order.Id, new UpdateOrderStatusByAdminRequestDto
        {
            Status = DeliveryStatusCodes.ReceivedByCustomer
        }, CancellationToken.None);

        Assert.Equal(OrderStatusCodes.Completed, result.Status);
        Assert.Equal(DeliveryStatusCodes.ReceivedByCustomer, result.DeliveryStatus);
        Assert.Equal(PaymentStatusCodes.Paid, result.PaymentStatus);
        fixture.OrderRepository.Verify(repository => repository.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompletePickupAsync_ShouldCompletePickupOrder_AndMarkPendingPaymentAsPaid()
    {
        var fixture = new OrderServiceFixture();
        var order = CreatePickupOrder();
        order.SetAssemblyStatus(DeliveryStatusCodes.ReadyForPickup, Guid.NewGuid(), Guid.NewGuid());

        fixture.OrderRepository
            .Setup(repository => repository.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        fixture.UserDirectoryService
            .Setup(service => service.GetByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, UserDirectoryDto>
            {
                ["customer-1"] = new() { Id = "customer-1", Email = "customer@example.com", FullName = "Иван Петров" }
            });
        SetupStatusLookups(fixture);

        var service = fixture.CreateService();

        var result = await service.CompletePickupAsync(order.Id, CancellationToken.None);

        Assert.Equal(OrderStatusCodes.Completed, result.Status);
        Assert.Equal(DeliveryStatusCodes.ReceivedByCustomer, result.DeliveryStatus);
        Assert.Equal(PaymentStatusCodes.Paid, result.PaymentStatus);
    }

    [Fact]
    public async Task AcceptForDeliveryAsync_ShouldAssignCurrentCourier_AndNotify()
    {
        var fixture = new OrderServiceFixture();
        var order = CreateDeliveryOrderReadyForCourier();

        fixture.CurrentUser.SetupGet(service => service.IsAuthenticated).Returns(true);
        fixture.CurrentUser.SetupGet(service => service.UserId).Returns("courier-1");
        fixture.OrderRepository
            .Setup(repository => repository.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        fixture.UserDirectoryService
            .Setup(service => service.GetByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, UserDirectoryDto>
            {
                ["customer-1"] = new() { Id = "customer-1", Email = "customer@example.com", FullName = "Иван Петров" },
                ["courier-1"] = new() { Id = "courier-1", Email = "courier@example.com", FullName = "Курьер" }
            });
        SetupStatusLookups(fixture);

        var service = fixture.CreateService();

        var result = await service.AcceptForDeliveryAsync(order.Id, CancellationToken.None);

        Assert.Equal("courier-1", result.CourierId);
        Assert.Equal(DeliveryStatusCodes.AcceptedByCourier, result.DeliveryStatus);
        fixture.OrderNotificationService.Verify(service => service.NotifyTransferredToDeliveryAsync(order, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateDeliveryStatusAsync_ShouldThrow_WhenOrderAssignedToAnotherCourier()
    {
        var fixture = new OrderServiceFixture();
        var order = CreateDeliveryOrderAssignedToCourier("courier-1");

        fixture.CurrentUser.SetupGet(service => service.IsAuthenticated).Returns(true);
        fixture.CurrentUser.SetupGet(service => service.UserId).Returns("courier-2");
        fixture.OrderRepository
            .Setup(repository => repository.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        var service = fixture.CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateDeliveryStatusAsync(order.Id, new UpdateDeliveryStatusRequestDto
        {
            Status = DeliveryStatusCodes.InTransit
        }, CancellationToken.None));
    }

    [Fact]
    public async Task GetMyOrdersAsync_ShouldReturnEmpty_WhenUserIsNotAuthenticated()
    {
        var fixture = new OrderServiceFixture();
        fixture.CurrentUser.SetupGet(service => service.IsAuthenticated).Returns(false);
        fixture.CurrentUser.SetupGet(service => service.UserId).Returns((string?)null);

        var service = fixture.CreateService();

        var result = await service.GetMyOrdersAsync(CancellationToken.None);

        Assert.Empty(result);
    }

    private static void SetupStatusLookups(OrderServiceFixture fixture)
    {
        fixture.OrderStatusReferenceRepository
            .Setup(repository => repository.GetByNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string name, CancellationToken _) => new OrderStatusReference(name));
        fixture.DeliveryStatusReferenceRepository
            .Setup(repository => repository.GetByNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string name, CancellationToken _) => new DeliveryStatusReference(name));
        fixture.PaymentStatusReferenceRepository
            .Setup(repository => repository.GetByNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string name, CancellationToken _) => new PaymentStatusReference(name));
    }

    private static Bouquet CreateBouquet(decimal price = 1000m)
    {
        return new Bouquet(
            "Тестовый букет",
            "Описание",
            "/images/bouquet.jpg",
            price,
            [Guid.NewGuid()],
            [Guid.NewGuid()]);
    }

    private static Order CreatePickupOrder()
    {
        var product = CreateBouquet(1500m);
        var order = new Order(
            101,
            "customer-1",
            DeliveryMethod.Pickup,
            [new OrderItem(product, 1)],
            1500m,
            Guid.NewGuid());
        order.AttachDelivery(new Delivery(order.Id, "г. Москва, ул. Цветочная, д. 5", Guid.NewGuid()));
        order.AttachPayment(new Payment(order.Id, 1500m, "CashOnPickup", PaymentStatusCodes.Pending, Guid.NewGuid()));
        return order;
    }

    private static Order CreateDeliveryOrderWithPendingPayment()
    {
        var product = CreateBouquet(1800m);
        var order = new Order(
            202,
            "customer-1",
            DeliveryMethod.Delivery,
            [new OrderItem(product, 1)],
            1800m,
            Guid.NewGuid());
        order.AttachDelivery(new Delivery(order.Id, "г. Москва, ул. Садовая, д. 10", Guid.NewGuid()));
        order.AttachPayment(new Payment(order.Id, 1800m, "CashOnPickup", PaymentStatusCodes.Pending, Guid.NewGuid()));
        return order;
    }

    private static Order CreateDeliveryOrderAssignedToCourier(string courierId)
    {
        var product = CreateBouquet(1200m);
        var order = new Order(
            303,
            "customer-1",
            DeliveryMethod.Delivery,
            [new OrderItem(product, 1)],
            1200m,
            Guid.NewGuid());
        var delivery = new Delivery(order.Id, "г. Москва, ул. Лесная, д. 3", Guid.NewGuid());
        delivery.AcceptByCourier(courierId, Guid.NewGuid());
        order.AttachDelivery(delivery);
        order.AttachPayment(new Payment(order.Id, 1200m, "StubOnlinePayment", PaymentStatusCodes.Paid, Guid.NewGuid()));
        return order;
    }

    private static Order CreateDeliveryOrderReadyForCourier()
    {
        var product = CreateBouquet(1400m);
        var order = new Order(
            404,
            "customer-1",
            DeliveryMethod.Delivery,
            [new OrderItem(product, 1)],
            1400m,
            Guid.NewGuid());
        var delivery = new Delivery(order.Id, "г. Москва, ул. Полевая, д. 7", Guid.NewGuid());
        delivery.MarkReadyForPickup(Guid.NewGuid());
        order.AttachDelivery(delivery);
        order.AttachPayment(new Payment(order.Id, 1400m, "StubOnlinePayment", PaymentStatusCodes.Paid, Guid.NewGuid()));
        return order;
    }

    private sealed class OrderServiceFixture
    {
        public Mock<ICourierDirectoryService> CourierDirectoryService { get; } = new();
        public Mock<ICurrentUserService> CurrentUser { get; } = new();
        public Mock<IDeliveryStatusReferenceRepository> DeliveryStatusReferenceRepository { get; } = new();
        public Mock<IOrderNotificationService> OrderNotificationService { get; } = new();
        public Mock<IOrderRepository> OrderRepository { get; } = new();
        public Mock<IOrderStatusReferenceRepository> OrderStatusReferenceRepository { get; } = new();
        public Mock<IPaymentStatusReferenceRepository> PaymentStatusReferenceRepository { get; } = new();
        public Mock<IPromotionRepository> PromotionRepository { get; } = new();
        public Mock<IProductRepository> ProductRepository { get; } = new();
        public Mock<ISiteContactSettingsService> SiteContactSettingsService { get; } = new();
        public Mock<IUserDirectoryService> UserDirectoryService { get; } = new();

        public OrderServiceFixture()
        {
            PromotionRepository
                .Setup(repository => repository.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(Array.Empty<Promotion>());
            UserDirectoryService
                .Setup(service => service.GetByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Dictionary<string, UserDirectoryDto>());
            SiteContactSettingsService
                .Setup(service => service.GetAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new SiteContactSettingsDto { Address = "Пункт самовывоза" });
        }

        public OrderService CreateService()
        {
            return new OrderService(
                OrderRepository.Object,
                ProductRepository.Object,
                CurrentUser.Object,
                CourierDirectoryService.Object,
                OrderNotificationService.Object,
                SiteContactSettingsService.Object,
                UserDirectoryService.Object,
                OrderStatusReferenceRepository.Object,
                DeliveryStatusReferenceRepository.Object,
                PaymentStatusReferenceRepository.Object,
                PromotionRepository.Object);
        }
    }
}
