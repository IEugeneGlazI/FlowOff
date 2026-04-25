using System.ComponentModel.DataAnnotations;

namespace Flowoff.Application.DTOs.Reservations;

public sealed class CreateReservationRequestDto
{
    [Required]
    public Guid ProductId { get; init; }

    [Required]
    public DateTime StartAtUtc { get; init; }

    [Required]
    public DateTime EndAtUtc { get; init; }
}

public sealed class ReservationDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public DateTime StartAtUtc { get; init; }
    public DateTime EndAtUtc { get; init; }
    public string Status { get; init; } = string.Empty;
    public bool IsShowcase { get; init; }
}
