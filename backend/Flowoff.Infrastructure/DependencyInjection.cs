using System.Text;
using Flowoff.Application.Interfaces;
using Flowoff.Application.Services;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Flowoff.Infrastructure.Identity;
using Flowoff.Infrastructure.Options;
using Flowoff.Infrastructure.Repositories;
using Flowoff.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Flowoff.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SmtpOptions>(configuration.GetSection("Smtp"));
        services.Configure<DaDataOptions>(configuration.GetSection("DaData"));

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

        services.AddDbContext<FlowoffDbContext>(options =>
            options.UseSqlServer(connectionString));

        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 6;
                options.SignIn.RequireConfirmedEmail = true;
            })
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<FlowoffDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        var jwtKey = configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key is not configured.");
        var jwtIssuer = configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT issuer is not configured.");
        var jwtAudience = configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT audience is not configured.");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };
            });

        services.AddAuthorization();
        services.AddHttpContextAccessor();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICourierDirectoryService, CourierDirectoryService>();
        services.AddScoped<IUserDirectoryService, UserDirectoryService>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<IOrderNotificationService, OrderNotificationService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IReferenceDataService, ReferenceDataService>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IColorRepository, ColorRepository>();
        services.AddScoped<IFlowerInRepository, FlowerInRepository>();
        services.AddScoped<IOrderStatusReferenceRepository, OrderStatusReferenceRepository>();
        services.AddScoped<IDeliveryStatusReferenceRepository, DeliveryStatusReferenceRepository>();
        services.AddScoped<IPaymentStatusReferenceRepository, PaymentStatusReferenceRepository>();
        services.AddScoped<ISupportStatusReferenceRepository, SupportStatusReferenceRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IPromotionRepository, PromotionRepository>();
        services.AddScoped<ISiteContactSettingsRepository, SiteContactSettingsRepository>();
        services.AddScoped<ISupportRequestRepository, SupportRequestRepository>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IPromotionService, PromotionService>();
        services.AddScoped<ISiteContactSettingsService, SiteContactSettingsService>();
        services.AddScoped<IStatisticsService, StatisticsService>();
        services.AddScoped<ISupportRequestService, SupportRequestService>();
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddHttpClient<IAddressSuggestionService, DaDataAddressSuggestionService>((provider, client) =>
        {
            var options = provider.GetRequiredService<IOptions<DaDataOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/'));
        });

        return services;
    }
}
