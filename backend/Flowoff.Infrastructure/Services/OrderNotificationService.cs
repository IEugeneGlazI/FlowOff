using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace Flowoff.Infrastructure.Services;

public class OrderNotificationService : IOrderNotificationService
{
    private readonly IEmailSender _emailSender;
    private readonly ILogger<OrderNotificationService> _logger;
    private readonly UserManager<ApplicationUser> _userManager;

    public OrderNotificationService(
        UserManager<ApplicationUser> userManager,
        IEmailSender emailSender,
        ILogger<OrderNotificationService> logger)
    {
        _userManager = userManager;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task NotifyPickupReadyAsync(Order order, CancellationToken cancellationToken)
    {
        var user = await GetCustomerAsync(order.CustomerId);
        if (user is null)
        {
            return;
        }

        var orderNumber = GetOrderNumber(order);
        var greeting = GetGreeting(user);

        await TrySendAsync(
            user.Email!,
            $"Ваш заказ {orderNumber} готов к самовывозу",
            FlowoffEmailTemplate.Build(
                eyebrow: "Самовывоз",
                title: "Заказ готов к выдаче",
                intro: $"{greeting}, ваш заказ {orderNumber} собран.",
                details: "Вы можете забрать его в удобное время.",
                footnote: "Статус заказа уже обновился в вашем личном кабинете Flowoff.",
                facts: new[]
                {
                    ("Номер заказа", orderNumber),
                    ("Способ получения", "Самовывоз")
                }),
            order.Id,
            cancellationToken);
    }

    public async Task NotifyTransferredToDeliveryAsync(Order order, CancellationToken cancellationToken)
    {
        var user = await GetCustomerAsync(order.CustomerId);
        if (user is null)
        {
            return;
        }

        var orderNumber = GetOrderNumber(order);
        var greeting = GetGreeting(user);
        var address = string.IsNullOrWhiteSpace(order.Delivery?.Address)
            ? string.Empty
            : $"<p>Адрес доставки: <strong>{order.Delivery.Address}</strong></p>";

        await TrySendAsync(
            user.Email!,
            $"Заказ {orderNumber} передан в доставку",
            FlowoffEmailTemplate.Build(
                eyebrow: "Доставка",
                title: "Заказ передан курьеру",
                intro: $"{greeting}, ваш заказ {orderNumber} уже передан в доставку.",
                details: "Как только доставка будет завершена, мы отправим вам еще одно письмо.",
                footnote: "Вы можете следить за обновлением статуса в личном кабинете Flowoff.",
                facts: BuildDeliveryFacts(orderNumber, order.Delivery?.Address)),
            order.Id,
            cancellationToken);
    }

    public async Task NotifyDeliveredAsync(Order order, CancellationToken cancellationToken)
    {
        var user = await GetCustomerAsync(order.CustomerId);
        if (user is null)
        {
            return;
        }

        var orderNumber = GetOrderNumber(order);
        var greeting = GetGreeting(user);

        await TrySendAsync(
            user.Email!,
            $"Заказ {orderNumber} доставлен",
            FlowoffEmailTemplate.Build(
                eyebrow: "Доставка",
                title: "Заказ доставлен",
                intro: $"{greeting}, ваш заказ {orderNumber} доставлен.",
                details: "Спасибо, что выбрали Flowoff.",
                footnote: "Надеемся, что букет и подарок принесли именно те эмоции, ради которых вы их выбирали.",
                facts: BuildDeliveredFacts(orderNumber, order.Delivery?.Address)),
            order.Id,
            cancellationToken);
    }

    private async Task<ApplicationUser?> GetCustomerAsync(string customerId)
    {
        var user = await _userManager.FindByIdAsync(customerId);
        if (user is null || user.IsDeleted || string.IsNullOrWhiteSpace(user.Email))
        {
            return null;
        }

        return user;
    }

    private static string GetOrderNumber(Order order)
    {
        return $"#{order.Id.ToString()[..8].ToUpperInvariant()}";
    }

    private static string GetGreeting(ApplicationUser user)
    {
        return string.IsNullOrWhiteSpace(user.FullName) ? "Здравствуйте" : $"{user.FullName}, здравствуйте";
    }

    private static IReadOnlyCollection<(string Label, string Value)> BuildDeliveryFacts(string orderNumber, string? address)
    {
        var facts = new List<(string Label, string Value)>
        {
            ("Номер заказа", orderNumber),
            ("Статус", "Передан в доставку")
        };

        if (!string.IsNullOrWhiteSpace(address))
        {
            facts.Add(("Адрес доставки", address));
        }

        return facts;
    }

    private static IReadOnlyCollection<(string Label, string Value)> BuildDeliveredFacts(string orderNumber, string? address)
    {
        var facts = new List<(string Label, string Value)>
        {
            ("Номер заказа", orderNumber),
            ("Статус", "Доставлен")
        };

        if (!string.IsNullOrWhiteSpace(address))
        {
            facts.Add(("Адрес доставки", address));
        }

        return facts;
    }

    private async Task TrySendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        Guid orderId,
        CancellationToken cancellationToken)
    {
        try
        {
            await _emailSender.SendAsync(toEmail, subject, htmlBody, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Failed to send order notification. OrderId: {OrderId}, ToEmail: {ToEmail}, Subject: {Subject}",
                orderId,
                toEmail,
                subject);
        }
    }
}
