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
    public DbSet<FlowerIn> FlowerIns => Set<FlowerIn>();
    public DbSet<Color> Colors => Set<Color>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Bouquet> Bouquets => Set<Bouquet>();
    public DbSet<Flower> Flowers => Set<Flower>();
    public DbSet<Gift> Gifts => Set<Gift>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Delivery> Deliveries => Set<Delivery>();
    public DbSet<Payment> Payments => Set<Payment>();
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
            entity.Property(category => category.IsDeleted).HasDefaultValue(false);
        });

        builder.Entity<FlowerIn>(entity =>
        {
            entity.Property(flowerIn => flowerIn.Name).HasMaxLength(100).IsRequired();
            entity.Property(flowerIn => flowerIn.IsDeleted).HasDefaultValue(false);
            entity.HasIndex(flowerIn => flowerIn.Name).IsUnique();
        });

        builder.Entity<Color>(entity =>
        {
            entity.Property(color => color.Name).HasMaxLength(100).IsRequired();
            entity.Property(color => color.IsDeleted).HasDefaultValue(false);
            entity.HasIndex(color => color.Name).IsUnique();
        });

        builder.Entity<Product>(entity =>
        {
            entity.UseTpcMappingStrategy();
            entity.Property(product => product.Name).HasMaxLength(150).IsRequired();
            entity.Property(product => product.Description).HasMaxLength(2000);
            entity.Property(product => product.ImageUrl).HasMaxLength(2000);
            entity.Property(product => product.Price).HasPrecision(18, 2);
            entity.Property(product => product.IsVisible).HasDefaultValue(true);
            entity.Property(product => product.IsDeleted).HasDefaultValue(false);
        });

        builder.Entity<Flower>(entity =>
        {
            entity.ToTable("Flowers");
            entity.HasOne(flower => flower.FlowerIn)
                .WithMany()
                .HasForeignKey(flower => flower.FlowerInId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(flower => flower.Color)
                .WithMany()
                .HasForeignKey(flower => flower.ColorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Bouquet>(entity =>
        {
            entity.ToTable("Bouquets");
            entity.HasMany(bouquet => bouquet.FlowerIns)
                .WithOne(item => item.Bouquet)
                .HasForeignKey(item => item.BouquetId);
            entity.HasMany(bouquet => bouquet.Colors)
                .WithOne(item => item.Bouquet)
                .HasForeignKey(item => item.BouquetId);
        });

        builder.Entity<BouquetFlowerIn>(entity =>
        {
            entity.ToTable("BouquetFlowerIns");
            entity.HasKey(item => new { item.BouquetId, item.FlowerInId });
            entity.HasOne(item => item.FlowerIn)
                .WithMany()
                .HasForeignKey(item => item.FlowerInId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<BouquetColor>(entity =>
        {
            entity.ToTable("BouquetColors");
            entity.HasKey(item => new { item.BouquetId, item.ColorId });
            entity.HasOne(item => item.Color)
                .WithMany()
                .HasForeignKey(item => item.ColorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Gift>(entity =>
        {
            entity.ToTable("Gifts");
            entity.HasOne(gift => gift.Category)
                .WithMany()
                .HasForeignKey(gift => gift.CategoryId)
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
            entity.Ignore(item => item.ProductId);
            entity.HasIndex(item => new { item.CartId, item.BouquetId })
                .IsUnique()
                .HasFilter("[BouquetId] IS NOT NULL");
            entity.HasIndex(item => new { item.CartId, item.FlowerId })
                .IsUnique()
                .HasFilter("[FlowerId] IS NOT NULL");
            entity.HasIndex(item => new { item.CartId, item.GiftId })
                .IsUnique()
                .HasFilter("[GiftId] IS NOT NULL");
            entity.HasOne(item => item.Bouquet)
                .WithMany()
                .HasForeignKey(item => item.BouquetId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Flower)
                .WithMany()
                .HasForeignKey(item => item.FlowerId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Gift)
                .WithMany()
                .HasForeignKey(item => item.GiftId)
                .OnDelete(DeleteBehavior.Restrict);
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
            entity.Ignore(item => item.ProductId);
            entity.Property(item => item.ProductType).HasMaxLength(32).IsRequired();
            entity.Property(item => item.ProductName).HasMaxLength(150).IsRequired();
            entity.Property(item => item.UnitPrice).HasPrecision(18, 2);
            entity.HasOne(item => item.Bouquet)
                .WithMany()
                .HasForeignKey(item => item.BouquetId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Flower)
                .WithMany()
                .HasForeignKey(item => item.FlowerId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Gift)
                .WithMany()
                .HasForeignKey(item => item.GiftId)
                .OnDelete(DeleteBehavior.Restrict);
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
            entity.HasMany(promotion => promotion.Bouquets)
                .WithOne(item => item.Promotion)
                .HasForeignKey(item => item.PromotionId);
            entity.HasMany(promotion => promotion.Flowers)
                .WithOne(item => item.Promotion)
                .HasForeignKey(item => item.PromotionId);
            entity.HasMany(promotion => promotion.Gifts)
                .WithOne(item => item.Promotion)
                .HasForeignKey(item => item.PromotionId);
        });

        builder.Entity<PromotionBouquet>(entity =>
        {
            entity.ToTable("PromotionBouquets");
            entity.HasKey(item => new { item.PromotionId, item.BouquetId });
            entity.HasOne(item => item.Bouquet)
                .WithMany()
                .HasForeignKey(item => item.BouquetId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PromotionFlower>(entity =>
        {
            entity.ToTable("PromotionFlowers");
            entity.HasKey(item => new { item.PromotionId, item.FlowerId });
            entity.HasOne(item => item.Flower)
                .WithMany()
                .HasForeignKey(item => item.FlowerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PromotionGift>(entity =>
        {
            entity.ToTable("PromotionGifts");
            entity.HasKey(item => new { item.PromotionId, item.GiftId });
            entity.HasOne(item => item.Gift)
                .WithMany()
                .HasForeignKey(item => item.GiftId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
