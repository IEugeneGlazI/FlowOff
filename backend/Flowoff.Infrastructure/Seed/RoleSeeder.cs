using Flowoff.Domain.Enums;
using Flowoff.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Seed;

public static class RoleSeeder
{
    public static async Task SeedAsync(RoleManager<IdentityRole> roleManager, UserManager<ApplicationUser> userManager)
    {
        var roles = new[]
        {
            UserRole.Customer.ToString(),
            UserRole.Florist.ToString(),
            UserRole.Courier.ToString(),
            UserRole.Administrator.ToString()
        };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        const string adminEmail = "admin@flowoff.local";
        var admin = await userManager.Users.FirstOrDefaultAsync(user => user.Email == adminEmail);
        if (admin is null)
        {
            admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "System Administrator",
                Role = UserRole.Administrator,
                EmailConfirmed = true
            };

            var createAdminResult = await userManager.CreateAsync(admin, "Admin123!");
            if (createAdminResult.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, UserRole.Administrator.ToString());
            }
        }

        await EnsureUserAsync(
            userManager,
            "florist@flowoff.local",
            "Florist123!",
            "Main Florist",
            UserRole.Florist);

        await EnsureUserAsync(
            userManager,
            "courier@flowoff.local",
            "Courier123!",
            "Main Courier",
            UserRole.Courier);
    }

    private static async Task EnsureUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string password,
        string fullName,
        UserRole role)
    {
        var existingUser = await userManager.Users.FirstOrDefaultAsync(user => user.Email == email);
        if (existingUser is not null)
        {
            return;
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            Role = role,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, password);
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(user, role.ToString());
        }
    }
}
