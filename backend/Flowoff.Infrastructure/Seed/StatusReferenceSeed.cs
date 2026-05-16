using Flowoff.Domain.Entities;
using Flowoff.Domain.Statuses;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Seed;

public static class StatusReferenceSeed
{
    public static async Task SeedAsync(FlowoffDbContext dbContext)
    {
        await SyncOrderStatusesAsync(dbContext);
        await SyncDeliveryStatusesAsync(dbContext);
        await SyncPaymentStatusesAsync(dbContext);
        await SyncSupportStatusesAsync(dbContext);

        await dbContext.SaveChangesAsync();
    }

    private static Task SyncOrderStatusesAsync(FlowoffDbContext dbContext)
    {
        return SyncStatusesAsync(
            dbContext.OrderStatusReferences,
            OrderStatusCodes.All,
            name => new OrderStatusReference(name));
    }

    private static Task SyncDeliveryStatusesAsync(FlowoffDbContext dbContext)
    {
        return SyncStatusesAsync(
            dbContext.DeliveryStatusReferences,
            DeliveryStatusCodes.All,
            name => new DeliveryStatusReference(name));
    }

    private static Task SyncPaymentStatusesAsync(FlowoffDbContext dbContext)
    {
        return SyncStatusesAsync(
            dbContext.PaymentStatusReferences,
            PaymentStatusCodes.All,
            name => new PaymentStatusReference(name));
    }

    private static Task SyncSupportStatusesAsync(FlowoffDbContext dbContext)
    {
        return SyncStatusesAsync(
            dbContext.SupportStatusReferences,
            SupportStatusCodes.All,
            name => new SupportStatusReference(name));
    }

    private static async Task SyncStatusesAsync<TEntity>(
        DbSet<TEntity> dbSet,
        IReadOnlyCollection<string> activeNames,
        Func<string, TEntity> factory)
        where TEntity : class
    {
        var existing = await dbSet.ToListAsync();
        var activeNameSet = activeNames.ToHashSet(StringComparer.Ordinal);

        foreach (var entity in existing)
        {
            switch (entity)
            {
                case OrderStatusReference orderStatus:
                    if (activeNameSet.Contains(orderStatus.Name))
                    {
                        orderStatus.Restore(orderStatus.Name);
                    }
                    else
                    {
                        dbSet.Remove(entity);
                    }
                    break;
                case DeliveryStatusReference deliveryStatus:
                    if (activeNameSet.Contains(deliveryStatus.Name))
                    {
                        deliveryStatus.Restore(deliveryStatus.Name);
                    }
                    else
                    {
                        dbSet.Remove(entity);
                    }
                    break;
                case PaymentStatusReference paymentStatus:
                    if (activeNameSet.Contains(paymentStatus.Name))
                    {
                        paymentStatus.Restore(paymentStatus.Name);
                    }
                    else
                    {
                        dbSet.Remove(entity);
                    }
                    break;
                case SupportStatusReference supportStatus:
                    if (activeNameSet.Contains(supportStatus.Name))
                    {
                        supportStatus.Restore(supportStatus.Name);
                    }
                    else
                    {
                        dbSet.Remove(entity);
                    }
                    break;
            }
        }

        var existingNames = existing
            .Select(entity => entity switch
            {
                OrderStatusReference orderStatus => orderStatus.Name,
                DeliveryStatusReference deliveryStatus => deliveryStatus.Name,
                PaymentStatusReference paymentStatus => paymentStatus.Name,
                SupportStatusReference supportStatus => supportStatus.Name,
                _ => string.Empty
            })
            .ToHashSet(StringComparer.Ordinal);

        foreach (var name in activeNames)
        {
            if (!existingNames.Contains(name))
            {
                await dbSet.AddAsync(factory(name));
            }
        }
    }
}
