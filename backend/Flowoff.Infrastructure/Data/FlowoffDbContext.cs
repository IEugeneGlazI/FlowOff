using Flowoff.Domain.Entities;
using Flowoff.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Data;

public class FlowoffDbContext : IdentityDbContext<ApplicationUser>
{
    public FlowoffDbContext(DbContextOptions<FlowoffDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Delivery> Deliveries => Set<Delivery>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<CustomBouquet> CustomBouquets => Set<CustomBouquet>();
    public DbSet<CustomBouquetItem> CustomBouquetItems => Set<CustomBouquetItem>();
    public DbSet<SupportRequest> SupportRequests => Set<SupportRequest>();
    public DbSet<Promotion> Promotions => Set<Promotion>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(user => user.FullName).HasMaxLength(150);
            entity.Property(user => user.Role).HasConversion<string>().HasMaxLength(32);
            entity.Property(user => user.IsDeleted).HasDefaultValue(false);
        });

        builder.Entity<Category>(entity =>
        {
            entity.Property(category => category.Name).HasMaxLength(100).IsRequired();
            entity.Property(category => category.Description).HasMaxLength(500);
        });

        builder.Entity<Product>(entity =>
        {
            entity.Property(product => product.Name).HasMaxLength(150).IsRequired();
            entity.Property(product => product.Description).HasMaxLength(2000);
            entity.Property(product => product.Price).HasPrecision(18, 2);
            entity.Property(product => product.Type).HasConversion<string>().HasMaxLength(32);
            entity.Property(product => product.IsDeleted).HasDefaultValue(false);
            entity.HasOne(product => product.Category)
                .WithMany()
                .HasForeignKey(product => product.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Cart>(entity =>
        {
            entity.Property(cart => cart.CustomerId).HasMaxLength(450).IsRequired();
            entity.HasIndex(cart => cart.CustomerId).IsUnique();
            entity.HasMany(cart => cart.Items)
                .WithOne(item => item.Cart)
                .HasForeignKey(item => item.CartId);
        });

        builder.Entity<CartItem>(entity =>
        {
            entity.HasOne(item => item.Product)
                .WithMany()
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(item => new { item.CartId, item.ProductId }).IsUnique();
        });

        builder.Entity<Order>(entity =>
        {
            entity.Property(order => order.CustomerId).HasMaxLength(450).IsRequired();
            entity.Property(order => order.TotalAmount).HasPrecision(18, 2);
            entity.Property(order => order.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(order => order.DeliveryMethod).HasConversion<string>().HasMaxLength(32);
            entity.HasMany(order => order.Items)
                .WithOne(item => item.Order)
                .HasForeignKey(item => item.OrderId);
        });

        builder.Entity<OrderItem>(entity =>
        {
            entity.Property(item => item.ProductName).HasMaxLength(150).IsRequired();
            entity.Property(item => item.UnitPrice).HasPrecision(18, 2);
        });

        builder.Entity<Delivery>(entity =>
        {
            entity.Property(delivery => delivery.Address).HasMaxLength(500);
            entity.Property(delivery => delivery.CourierId).HasMaxLength(450);
            entity.HasOne(delivery => delivery.Order)
                .WithOne(order => order.Delivery)
                .HasForeignKey<Delivery>(delivery => delivery.OrderId);
        });

        builder.Entity<Payment>(entity =>
        {
            entity.Property(payment => payment.Amount).HasPrecision(18, 2);
            entity.Property(payment => payment.Provider).HasMaxLength(100).IsRequired();
            entity.Property(payment => payment.Status).HasConversion<string>().HasMaxLength(32);
            entity.HasOne(payment => payment.Order)
                .WithOne(order => order.Payment)
                .HasForeignKey<Payment>(payment => payment.OrderId);
        });

        builder.Entity<Reservation>(entity =>
        {
            entity.Property(reservation => reservation.CustomerId).HasMaxLength(450).IsRequired();
            entity.Property(reservation => reservation.Status).HasConversion<string>().HasMaxLength(32);
            entity.HasOne(reservation => reservation.Product)
                .WithMany()
                .HasForeignKey(reservation => reservation.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<CustomBouquet>(entity =>
        {
            entity.Property(bouquet => bouquet.CustomerId).HasMaxLength(450).IsRequired();
            entity.Property(bouquet => bouquet.Name).HasMaxLength(150).IsRequired();
            entity.Property(bouquet => bouquet.TotalPrice).HasPrecision(18, 2);
            entity.HasMany(bouquet => bouquet.Items)
                .WithOne(item => item.CustomBouquet)
                .HasForeignKey(item => item.CustomBouquetId);
        });

        builder.Entity<CustomBouquetItem>(entity =>
        {
            entity.Property(item => item.UnitPrice).HasPrecision(18, 2);
            entity.HasOne(item => item.Product)
                .WithMany()
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<SupportRequest>(entity =>
        {
            entity.Property(request => request.CustomerId).HasMaxLength(450).IsRequired();
            entity.Property(request => request.Subject).HasMaxLength(200).IsRequired();
            entity.Property(request => request.Message).HasMaxLength(4000).IsRequired();
            entity.Property(request => request.Status).HasConversion<string>().HasMaxLength(32);
        });

        builder.Entity<Promotion>(entity =>
        {
            entity.Property(promotion => promotion.Title).HasMaxLength(150).IsRequired();
            entity.Property(promotion => promotion.Description).HasMaxLength(1000);
            entity.Property(promotion => promotion.DiscountPercent).HasPrecision(5, 2);
            entity.Property(promotion => promotion.IsDeleted).HasDefaultValue(false);
        });
    }
}
