using Flowoff.Application.DTOs.Reservations;
using Flowoff.Application.Interfaces;
using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;

namespace Flowoff.Application.Services;

public class ReservationService : IReservationService
{
    private const int MaxReservationDurationHours = 24;

    private readonly ICurrentUserService _currentUserService;
    private readonly IProductRepository _productRepository;
    private readonly IReservationRepository _reservationRepository;

    public ReservationService(
        IReservationRepository reservationRepository,
        IProductRepository productRepository,
        ICurrentUserService currentUserService)
    {
        _reservationRepository = reservationRepository;
        _productRepository = productRepository;
        _currentUserService = currentUserService;
    }

    public async Task CancelAsync(Guid reservationId, CancellationToken cancellationToken)
    {
        var reservation = await _reservationRepository.GetByIdAsync(reservationId, cancellationToken)
            ?? throw new InvalidOperationException("Reservation not found.");

        var canManageAllReservations = string.Equals(_currentUserService.Role, UserRole.Florist.ToString(), StringComparison.Ordinal)
            || string.Equals(_currentUserService.Role, UserRole.Administrator.ToString(), StringComparison.Ordinal);

        if (!canManageAllReservations && reservation.CustomerId != GetRequiredCustomerId())
        {
            throw new InvalidOperationException("You cannot cancel this reservation.");
        }

        reservation.Cancel();
        await _reservationRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<ReservationDto> CreateAsync(CreateReservationRequestDto request, CancellationToken cancellationToken)
    {
        var customerId = GetRequiredCustomerId();

        if (request.StartAtUtc >= request.EndAtUtc)
        {
            throw new InvalidOperationException("Reservation end time must be later than start time.");
        }

        if (request.StartAtUtc < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Reservation cannot start in the past.");
        }

        if (request.EndAtUtc > request.StartAtUtc.AddHours(MaxReservationDurationHours))
        {
            throw new InvalidOperationException("Reservation duration cannot exceed 24 hours.");
        }

        var product = await _productRepository.GetByIdAsync(request.ProductId, cancellationToken)
            ?? throw new InvalidOperationException("Product not found.");

        if (!product.IsShowcase || product.Type != ProductType.Bouquet)
        {
            throw new InvalidOperationException("Only showcase bouquets can be reserved.");
        }

        var activeReservations = await _reservationRepository.GetActiveByProductIdAsync(product.Id, cancellationToken);
        if (activeReservations.Any(reservation => reservation.Overlaps(request.StartAtUtc, request.EndAtUtc)))
        {
            throw new InvalidOperationException("This bouquet is already reserved for the selected time.");
        }

        var reservation = new Reservation(customerId, product.Id, request.StartAtUtc, request.EndAtUtc);
        await _reservationRepository.AddAsync(reservation, cancellationToken);

        return Map(reservation, product.Name, product.IsShowcase);
    }

    public async Task<IReadOnlyCollection<ReservationDto>> GetActiveReservationsAsync(CancellationToken cancellationToken)
    {
        var reservations = await _reservationRepository.GetActiveAsync(cancellationToken);
        return reservations.Select(reservation => Map(reservation, reservation.Product?.Name, reservation.Product?.IsShowcase ?? false)).ToArray();
    }

    public async Task<IReadOnlyCollection<ReservationDto>> GetMyReservationsAsync(CancellationToken cancellationToken)
    {
        var reservations = await _reservationRepository.GetByCustomerIdAsync(GetRequiredCustomerId(), cancellationToken);

        foreach (var reservation in reservations.Where(reservation => reservation.Status == ReservationStatus.Active && reservation.EndAtUtc <= DateTime.UtcNow))
        {
            reservation.Expire();
        }

        await _reservationRepository.SaveChangesAsync(cancellationToken);

        return reservations.Select(reservation => Map(reservation, reservation.Product?.Name, reservation.Product?.IsShowcase ?? false)).ToArray();
    }

    private string GetRequiredCustomerId()
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
        {
            throw new InvalidOperationException("Authenticated user is required.");
        }

        return _currentUserService.UserId;
    }

    private static ReservationDto Map(Reservation reservation, string? productName, bool isShowcase) =>
        new()
        {
            Id = reservation.Id,
            ProductId = reservation.ProductId,
            ProductName = productName ?? string.Empty,
            StartAtUtc = reservation.StartAtUtc,
            EndAtUtc = reservation.EndAtUtc,
            Status = reservation.Status.ToString(),
            IsShowcase = isShowcase
        };
}
