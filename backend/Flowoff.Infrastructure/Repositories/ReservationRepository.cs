using Flowoff.Domain.Entities;
using Flowoff.Domain.Enums;
using Flowoff.Domain.Repositories;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Repositories;

public class ReservationRepository : IReservationRepository
{
    private readonly FlowoffDbContext _dbContext;

    public ReservationRepository(FlowoffDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Reservation reservation, CancellationToken cancellationToken)
    {
        await _dbContext.Reservations.AddAsync(reservation, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<Reservation>> GetActiveAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Reservations
            .AsNoTracking()
            .Include(reservation => reservation.Product)
            .Where(reservation => reservation.Status == ReservationStatus.Active)
            .OrderBy(reservation => reservation.StartAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<Reservation>> GetActiveByProductIdAsync(Guid productId, CancellationToken cancellationToken)
    {
        return await _dbContext.Reservations
            .Where(reservation => reservation.ProductId == productId && reservation.Status == ReservationStatus.Active)
            .ToArrayAsync(cancellationToken);
    }

    public Task<Reservation?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.Reservations
            .Include(reservation => reservation.Product)
            .FirstOrDefaultAsync(reservation => reservation.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Reservation>> GetByCustomerIdAsync(string customerId, CancellationToken cancellationToken)
    {
        return await _dbContext.Reservations
            .Include(reservation => reservation.Product)
            .Where(reservation => reservation.CustomerId == customerId)
            .OrderByDescending(reservation => reservation.StartAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
