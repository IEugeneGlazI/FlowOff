using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Flowoff.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public ICollection<Cart> Carts { get; set; } = [];
    public ICollection<Order> CustomerOrders { get; set; } = [];
    public ICollection<Order> FloristOrders { get; set; } = [];
    public ICollection<Delivery> CourierDeliveries { get; set; } = [];
    public ICollection<SupportRequest> SupportRequests { get; set; } = [];
    public ICollection<SupportRequestMessage> SupportRequestMessages { get; set; } = [];
}
