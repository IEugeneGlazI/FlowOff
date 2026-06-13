using Flowoff.Domain.Enums;
using Flowoff.Domain.Statuses;
using Flowoff.Infrastructure.Repositories;
using Flowoff.Infrastructure.Tests.TestHelpers;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Tests.Repositories;

public class OrderRepositoryTests : IDisposable
{
    private readonly SqliteFlowoffDbContextFactory _dbFactory = new();

    [Fact]
    public async Task GetNextOrderNumberAsync_ShouldReturnOneMoreThanCurrentMaximum()
    {
        await using var context = _dbFactory.CreateDbContext();
        await SeedUsersAsync(context);
        var refs = await SeedStatusReferencesAsync(context);
        var product = await SeedBouquetCatalogAsync(context);

        context.Orders.Add(TestDataFactory.CreateOrder(
            1005,
            "customer-1",
            DeliveryMethod.Pickup,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.UnderReviewDeliveryStatus.Id,
            "Самовывоз"));
        context.Orders.Add(TestDataFactory.CreateOrder(
            1009,
            "customer-1",
            DeliveryMethod.Pickup,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.UnderReviewDeliveryStatus.Id,
            "Самовывоз"));
        await context.SaveChangesAsync();

        var repository = new OrderRepository(context);

        var nextNumber = await repository.GetNextOrderNumberAsync(CancellationToken.None);

        Assert.Equal(1010, nextNumber);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldLoadItemsDeliveryPaymentAndStatusReferences()
    {
        await using var context = _dbFactory.CreateDbContext();
        await SeedUsersAsync(context);
        var refs = await SeedStatusReferencesAsync(context);
        var product = await SeedBouquetCatalogAsync(context);
        var order = TestDataFactory.CreateOrder(
            2001,
            "customer-1",
            DeliveryMethod.Delivery,
            product,
            2,
            refs.ActiveOrderStatus.Id,
            refs.ReadyForPickupDeliveryStatus.Id,
            "г. Москва, ул. Садовая, д. 1",
            paymentStatusReferenceId: refs.PaidPaymentStatus.Id,
            paymentStatusName: PaymentStatusCodes.Paid);
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var repository = new OrderRepository(context);

        var result = await repository.GetByIdAsync(order.Id, CancellationToken.None);

        Assert.NotNull(result);
        Assert.NotNull(result!.OrderStatusReference);
        Assert.NotNull(result.Delivery);
        Assert.NotNull(result.Delivery!.DeliveryStatusReference);
        Assert.NotNull(result.Payment);
        Assert.NotNull(result.Payment!.PaymentStatusReference);
        Assert.Single(result.Items);
        Assert.NotNull(result.Items.Single().Bouquet);
    }

    [Fact]
    public async Task GetAvailableForCourierAsync_ShouldReturnOnlyActiveDeliveryOrdersReadyForPickupWithoutCourier()
    {
        await using var context = _dbFactory.CreateDbContext();
        await SeedUsersAsync(context);
        var refs = await SeedStatusReferencesAsync(context);
        var product = await SeedBouquetCatalogAsync(context);

        var available = TestDataFactory.CreateOrder(
            3001,
            "customer-1",
            DeliveryMethod.Delivery,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.ReadyForPickupDeliveryStatus.Id,
            "Адрес 1",
            orderStatusName: OrderStatusCodes.Active,
            deliveryStatusName: DeliveryStatusCodes.ReadyForPickup,
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);
        TestDataFactory.SetCreatedAtUtc(available, new DateTime(2026, 1, 3, 10, 0, 0, DateTimeKind.Utc));

        var assignedCourier = TestDataFactory.CreateOrder(
            3002,
            "customer-1",
            DeliveryMethod.Delivery,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.AcceptedByCourierDeliveryStatus.Id,
            "Адрес 2",
            orderStatusName: OrderStatusCodes.Active,
            deliveryStatusName: DeliveryStatusCodes.AcceptedByCourier,
            courierId: "courier-1",
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);

        var pickupOrder = TestDataFactory.CreateOrder(
            3003,
            "customer-1",
            DeliveryMethod.Pickup,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.ReadyForPickupDeliveryStatus.Id,
            "Самовывоз",
            orderStatusName: OrderStatusCodes.Active,
            deliveryStatusName: DeliveryStatusCodes.ReadyForPickup,
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);

        var cancelled = TestDataFactory.CreateOrder(
            3004,
            "customer-1",
            DeliveryMethod.Delivery,
            product,
            1,
            refs.CancelledOrderStatus.Id,
            refs.ReadyForPickupDeliveryStatus.Id,
            "Адрес 4",
            orderStatusName: OrderStatusCodes.Cancelled,
            deliveryStatusName: DeliveryStatusCodes.ReadyForPickup,
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);

        context.Orders.AddRange(available, assignedCourier, pickupOrder, cancelled);
        await context.SaveChangesAsync();

        var repository = new OrderRepository(context);

        var result = await repository.GetAvailableForCourierAsync(CancellationToken.None);

        Assert.Single(result);
        Assert.Equal(3001, result.Single().OrderNumber);
        Assert.Equal(DeliveryStatusCodes.ReadyForPickup, result.Single().Delivery!.Status);
    }

    [Fact]
    public async Task GetByCourierIdAsync_ShouldReturnOnlyOrdersAssignedToSpecifiedCourier()
    {
        await using var context = _dbFactory.CreateDbContext();
        await SeedUsersAsync(context);
        var refs = await SeedStatusReferencesAsync(context);
        var product = await SeedBouquetCatalogAsync(context);

        var first = TestDataFactory.CreateOrder(
            4001,
            "customer-1",
            DeliveryMethod.Delivery,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.AcceptedByCourierDeliveryStatus.Id,
            "Адрес 1",
            deliveryStatusName: DeliveryStatusCodes.AcceptedByCourier,
            courierId: "courier-1",
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);
        TestDataFactory.SetCreatedAtUtc(first, new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc));

        var second = TestDataFactory.CreateOrder(
            4002,
            "customer-1",
            DeliveryMethod.Delivery,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.InTransitDeliveryStatus.Id,
            "Адрес 2",
            deliveryStatusName: DeliveryStatusCodes.InTransit,
            courierId: "courier-1",
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);
        TestDataFactory.SetCreatedAtUtc(second, new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc));

        var чужой = TestDataFactory.CreateOrder(
            4003,
            "customer-1",
            DeliveryMethod.Delivery,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.AcceptedByCourierDeliveryStatus.Id,
            "Адрес 3",
            deliveryStatusName: DeliveryStatusCodes.AcceptedByCourier,
            courierId: "courier-2",
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);

        context.Orders.AddRange(first, second, чужой);
        await context.SaveChangesAsync();

        var repository = new OrderRepository(context);

        var result = await repository.GetByCourierIdAsync("courier-1", CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.Collection(
            result,
            order => Assert.Equal(4002, order.OrderNumber),
            order => Assert.Equal(4001, order.OrderNumber));
    }

    [Fact]
    public async Task GetByCustomerIdAsync_ShouldReturnCustomerOrdersSortedByCreatedAtDescending()
    {
        await using var context = _dbFactory.CreateDbContext();
        await SeedUsersAsync(context);
        var refs = await SeedStatusReferencesAsync(context);
        var product = await SeedBouquetCatalogAsync(context);

        var older = TestDataFactory.CreateOrder(
            5001,
            "customer-1",
            DeliveryMethod.Pickup,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.UnderReviewDeliveryStatus.Id,
            "Самовывоз",
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);
        TestDataFactory.SetCreatedAtUtc(older, new DateTime(2026, 1, 1, 9, 0, 0, DateTimeKind.Utc));

        var newer = TestDataFactory.CreateOrder(
            5002,
            "customer-1",
            DeliveryMethod.Delivery,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.ReadyForPickupDeliveryStatus.Id,
            "Адрес",
            deliveryStatusName: DeliveryStatusCodes.ReadyForPickup,
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);
        TestDataFactory.SetCreatedAtUtc(newer, new DateTime(2026, 1, 2, 9, 0, 0, DateTimeKind.Utc));

        var anotherCustomer = TestDataFactory.CreateOrder(
            5003,
            "customer-2",
            DeliveryMethod.Pickup,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.UnderReviewDeliveryStatus.Id,
            "Самовывоз",
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);

        context.Orders.AddRange(older, newer, anotherCustomer);
        await context.SaveChangesAsync();

        var repository = new OrderRepository(context);

        var result = await repository.GetByCustomerIdAsync("customer-1", CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.Collection(
            result,
            order => Assert.Equal(5002, order.OrderNumber),
            order => Assert.Equal(5001, order.OrderNumber));
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllOrdersSortedByCreatedAtDescending()
    {
        await using var context = _dbFactory.CreateDbContext();
        await SeedUsersAsync(context);
        var refs = await SeedStatusReferencesAsync(context);
        var product = await SeedBouquetCatalogAsync(context);

        var first = TestDataFactory.CreateOrder(
            6001,
            "customer-1",
            DeliveryMethod.Pickup,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.UnderReviewDeliveryStatus.Id,
            "Самовывоз",
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);
        TestDataFactory.SetCreatedAtUtc(first, new DateTime(2026, 2, 1, 9, 0, 0, DateTimeKind.Utc));

        var second = TestDataFactory.CreateOrder(
            6002,
            "customer-2",
            DeliveryMethod.Delivery,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.ReadyForPickupDeliveryStatus.Id,
            "Адрес",
            deliveryStatusName: DeliveryStatusCodes.ReadyForPickup,
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);
        TestDataFactory.SetCreatedAtUtc(second, new DateTime(2026, 2, 3, 9, 0, 0, DateTimeKind.Utc));

        var third = TestDataFactory.CreateOrder(
            6003,
            "customer-1",
            DeliveryMethod.Delivery,
            product,
            1,
            refs.ActiveOrderStatus.Id,
            refs.AcceptedByCourierDeliveryStatus.Id,
            "Адрес",
            deliveryStatusName: DeliveryStatusCodes.AcceptedByCourier,
            courierId: "courier-1",
            paymentStatusReferenceId: refs.PendingPaymentStatus.Id);
        TestDataFactory.SetCreatedAtUtc(third, new DateTime(2026, 2, 2, 9, 0, 0, DateTimeKind.Utc));

        context.Orders.AddRange(first, second, third);
        await context.SaveChangesAsync();

        var repository = new OrderRepository(context);

        var result = await repository.GetAllAsync(CancellationToken.None);

        Assert.Collection(
            result,
            order => Assert.Equal(6002, order.OrderNumber),
            order => Assert.Equal(6003, order.OrderNumber),
            order => Assert.Equal(6001, order.OrderNumber));
    }

    private static async Task SeedUsersAsync(Flowoff.Infrastructure.Data.FlowoffDbContext context)
    {
        context.Users.AddRange(
            TestDataFactory.CreateUser("customer-1", "customer1@test.local", UserRole.Customer),
            TestDataFactory.CreateUser("customer-2", "customer2@test.local", UserRole.Customer),
            TestDataFactory.CreateUser("courier-1", "courier1@test.local", UserRole.Courier),
            TestDataFactory.CreateUser("courier-2", "courier2@test.local", UserRole.Courier));
        await context.SaveChangesAsync();
    }

    private static async Task<(Flowoff.Domain.Entities.OrderStatusReference ActiveOrderStatus,
        Flowoff.Domain.Entities.OrderStatusReference CancelledOrderStatus,
        Flowoff.Domain.Entities.DeliveryStatusReference UnderReviewDeliveryStatus,
        Flowoff.Domain.Entities.DeliveryStatusReference ReadyForPickupDeliveryStatus,
        Flowoff.Domain.Entities.DeliveryStatusReference AcceptedByCourierDeliveryStatus,
        Flowoff.Domain.Entities.DeliveryStatusReference InTransitDeliveryStatus,
        Flowoff.Domain.Entities.PaymentStatusReference PendingPaymentStatus,
        Flowoff.Domain.Entities.PaymentStatusReference PaidPaymentStatus)> SeedStatusReferencesAsync(Flowoff.Infrastructure.Data.FlowoffDbContext context)
    {
        var active = TestDataFactory.CreateOrderStatus(OrderStatusCodes.Active);
        var cancelled = TestDataFactory.CreateOrderStatus(OrderStatusCodes.Cancelled);
        var underReview = TestDataFactory.CreateDeliveryStatus(DeliveryStatusCodes.UnderReview);
        var readyForPickup = TestDataFactory.CreateDeliveryStatus(DeliveryStatusCodes.ReadyForPickup);
        var acceptedByCourier = TestDataFactory.CreateDeliveryStatus(DeliveryStatusCodes.AcceptedByCourier);
        var inTransit = TestDataFactory.CreateDeliveryStatus(DeliveryStatusCodes.InTransit);
        var pending = TestDataFactory.CreatePaymentStatus(PaymentStatusCodes.Pending);
        var paid = TestDataFactory.CreatePaymentStatus(PaymentStatusCodes.Paid);

        context.OrderStatusReferences.AddRange(active, cancelled);
        context.DeliveryStatusReferences.AddRange(underReview, readyForPickup, acceptedByCourier, inTransit);
        context.PaymentStatusReferences.AddRange(pending, paid);
        await context.SaveChangesAsync();

        return (active, cancelled, underReview, readyForPickup, acceptedByCourier, inTransit, pending, paid);
    }

    private static async Task<Flowoff.Domain.Entities.Bouquet> SeedBouquetCatalogAsync(Flowoff.Infrastructure.Data.FlowoffDbContext context)
    {
        var color = TestDataFactory.CreateColor("Лиловый");
        var flowerIn = TestDataFactory.CreateFlowerIn("Эустома");
        var bouquet = TestDataFactory.CreateBouquet("Сирень", 1750m, flowerIn.Id, color.Id);

        context.Colors.Add(color);
        context.FlowerIns.Add(flowerIn);
        context.Bouquets.Add(bouquet);
        await context.SaveChangesAsync();

        return bouquet;
    }

    public void Dispose()
    {
        _dbFactory.Dispose();
    }
}
