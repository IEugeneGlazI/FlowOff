using Flowoff.Application.DTOs.Reservations;

namespace Flowoff.Application.Interfaces;

public interface IReservationService
{
    Task<ReservationDto> CreateAsync(CreateReservationRequestDto request, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<ReservationDto>> GetMyReservationsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyCollection<ReservationDto>> GetActiveReservationsAsync(CancellationToken cancellationToken);
    Task CancelAsync(Guid reservationId, CancellationToken cancellationToken);
}
