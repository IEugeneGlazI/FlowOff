using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Statuses;
using Flowoff.Infrastructure.Identity;

namespace Flowoff.Infrastructure.Tests.TestHelpers;

internal static class TestDataFactory
{
    public static ApplicationUser CreateUser(string id, string email, UserRole role)
    {
        return new ApplicationUser
        {
            Id = id,
            UserName = email,
            Email = email,
            NormalizedUserName = email.ToUpperInvariant(),
            NormalizedEmail = email.ToUpperInvariant(),
            FullName = email,
            Role = role
        };
    }

    public static Category CreateCategory(string name) => new(name);

    public static Color CreateColor(string name) => new(name);

    public static FlowerIn CreateFlowerIn(string name) => new(name);

    public static Bouquet CreateBouquet(
        string name,
        decimal price,
        Guid flowerInId,
        Guid colorId,
        bool isVisible = true)
    {
        return new Bouquet(name, $"{name} description", $"/images/{name}.jpg", price, [flowerInId], [colorId], isVisible);
    }

    public static Flower CreateFlower(
        string name,
        decimal price,
        Guid flowerInId,
        Guid colorId,
        bool isVisible = true)
    {
        return new Flower(name, $"{name} description", $"/images/{name}.jpg", price, flowerInId, colorId, isVisible);
    }

    public static Gift CreateGift(
        string name,
        decimal price,
        Guid categoryId,
        bool isVisible = true)
    {
        return new Gift(name, $"{name} description", $"/images/{name}.jpg", price, categoryId, isVisible);
    }

    public static OrderStatusReference CreateOrderStatus(string name) => new(name);

    public static DeliveryStatusReference CreateDeliveryStatus(string name) => new(name);

    public static PaymentStatusReference CreatePaymentStatus(string name) => new(name);

    public static void SetCreatedAtUtc(Order order, DateTime value)
    {
        typeof(Order).GetProperty(nameof(Order.CreatedAtUtc))!.SetValue(order, value);
    }

    public static Order CreateOrder(
        int orderNumber,
        string customerId,
        DeliveryMethod method,
        Product product,
        int quantity,
        Guid orderStatusReferenceId,
        Guid deliveryStatusReferenceId,
        string deliveryAddress,
        string orderStatusName = OrderStatusCodes.Active,
        string deliveryStatusName = DeliveryStatusCodes.UnderReview,
        string? courierId = null,
        Guid? paymentStatusReferenceId = null,
        string paymentStatusName = PaymentStatusCodes.Pending)
    {
        var item = new OrderItem(product, quantity);
        var order = new Order(orderNumber, customerId, method, [item], item.UnitPrice * quantity, orderStatusReferenceId);
        var delivery = new Delivery(order.Id, deliveryAddress, deliveryStatusReferenceId);
        delivery.SetStatusByAdmin(deliveryStatusReferenceId, deliveryStatusName);

        if (!string.IsNullOrWhiteSpace(courierId))
        {
            if (deliveryStatusName == DeliveryStatusCodes.AcceptedByCourier)
            {
                delivery.AcceptByCourier(courierId, deliveryStatusReferenceId);
            }
            else
            {
                delivery.MarkTransferringToDelivery(courierId, deliveryStatusReferenceId);
                delivery.SetStatusByAdmin(deliveryStatusReferenceId, deliveryStatusName);
            }
        }

        order.AttachDelivery(delivery);
        order.SetStatusByAdmin(orderStatusReferenceId, orderStatusName);

        if (paymentStatusReferenceId.HasValue)
        {
            order.AttachPayment(new Payment(order.Id, order.TotalAmount, "TestProvider", paymentStatusName, paymentStatusReferenceId.Value));
        }

        return order;
    }
}
