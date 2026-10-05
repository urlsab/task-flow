using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using TaskFlow.Application.DTOs.Finance;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Services;

public class FinanceService : IFinanceService
{
    private readonly AppDbContext _db;

    public FinanceService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<FinanceDashboardResponse> GetDashboardAsync(int userId)
    {
        var userRecords = _db.FinancialRecords
            .AsNoTracking()
            .Where(fr => fr.UserId == userId);

        var totals = await userRecords
            .GroupBy(_ => 1)
            .Select(g => new FinanceTotalsResponse(
                g.Where(x => x.Type == FinancialRecordType.Expense).Sum(x => x.Amount),
                g.Where(x => x.Type == FinancialRecordType.Income).Sum(x => x.Amount),
                g.Where(x => x.Type == FinancialRecordType.Donation).Sum(x => x.Amount),
                g.Where(x => x.Type == FinancialRecordType.Receipt).Sum(x => x.Amount),
                g.Where(x => x.Type == FinancialRecordType.Debt).Sum(x => x.Amount),
                g.Where(x => x.Type == FinancialRecordType.Debt && x.PaymentStatus == FinancialPaymentStatus.Paid).Sum(x => x.Amount),
                g.Where(x => x.Type == FinancialRecordType.Debt && x.PaymentStatus == FinancialPaymentStatus.Pending).Sum(x => x.Amount)
            ))
            .FirstOrDefaultAsync();

        var paidPayers = await BuildDebtStatusGroupsAsync(userId, FinancialPaymentStatus.Paid);
        var pendingPayers = await BuildDebtStatusGroupsAsync(userId, FinancialPaymentStatus.Pending);

        var latestRecords = await userRecords
            .OrderByDescending(fr => fr.Date)
            .ThenByDescending(fr => fr.CreatedAt)
            .Take(10)
            .Select(MapToResponseProjection())
            .ToListAsync();

        return new FinanceDashboardResponse(
            totals ?? new FinanceTotalsResponse(0, 0, 0, 0, 0, 0, 0),
            paidPayers,
            pendingPayers,
            latestRecords
        );
    }

    public async Task<IReadOnlyCollection<FinancialRecordResponse>> GetRecordsAsync(int userId, FinancialRecordQueryParameters query)
    {
        var records = _db.FinancialRecords
            .AsNoTracking()
            .Where(fr => fr.UserId == userId);

        if (query.Type.HasValue)
            records = records.Where(fr => fr.Type == query.Type.Value);

        if (query.PaymentStatus.HasValue)
            records = records.Where(fr => fr.PaymentStatus == query.PaymentStatus.Value);

        if (query.MinAmount.HasValue)
            records = records.Where(fr => fr.Amount >= query.MinAmount.Value);

        if (query.MaxAmount.HasValue)
            records = records.Where(fr => fr.Amount <= query.MaxAmount.Value);

        if (query.FromDate.HasValue)
            records = records.Where(fr => fr.Date.Date >= query.FromDate.Value.Date);

        if (query.ToDate.HasValue)
            records = records.Where(fr => fr.Date.Date <= query.ToDate.Value.Date);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLowerInvariant();
            records = records.Where(fr =>
                fr.PayerName.ToLower().Contains(search) ||
                fr.Description.ToLower().Contains(search) ||
                (fr.PaymentFor != null && fr.PaymentFor.ToLower().Contains(search)));
        }

        return await records
            .OrderByDescending(fr => fr.Date)
            .ThenByDescending(fr => fr.CreatedAt)
            .Select(MapToResponseProjection())
            .ToListAsync();
    }

    public async Task<FinancialRecordResponse> GetByIdAsync(int id, int userId)
    {
        var entity = await _db.FinancialRecords
            .AsNoTracking()
            .Where(fr => fr.Id == id && fr.UserId == userId)
            .Select(MapToResponseProjection())
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("רשומה כספית לא נמצאה.");

        return entity;
    }

    public async Task<FinancialRecordResponse> CreateAsync(int userId, CreateFinancialRecordRequest request)
    {
        var entity = new FinancialRecord
        {
            UserId = userId,
            Type = request.Type,
            PaymentStatus = request.PaymentStatus,
            PayerName = request.PayerName.Trim(),
            Description = request.Description.Trim(),
            Amount = request.Amount,
            Date = NormalizeToUtc(request.Date),
            PaymentFor = string.IsNullOrWhiteSpace(request.PaymentFor) ? null : request.PaymentFor.Trim()
        };

        _db.FinancialRecords.Add(entity);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(entity.Id, userId);
    }

    public async Task<FinancialRecordResponse> UpdateAsync(int id, int userId, UpdateFinancialRecordRequest request)
    {
        var entity = await _db.FinancialRecords
            .FirstOrDefaultAsync(fr => fr.Id == id && fr.UserId == userId)
            ?? throw new KeyNotFoundException("רשומה כספית לא נמצאה.");

        entity.Type = request.Type;
        entity.PaymentStatus = request.PaymentStatus;
        entity.PayerName = request.PayerName.Trim();
        entity.Description = request.Description.Trim();
        entity.Amount = request.Amount;
        entity.Date = NormalizeToUtc(request.Date);
        entity.PaymentFor = string.IsNullOrWhiteSpace(request.PaymentFor) ? null : request.PaymentFor.Trim();

        await _db.SaveChangesAsync();

        return await GetByIdAsync(id, userId);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _db.FinancialRecords
            .FirstOrDefaultAsync(fr => fr.Id == id && fr.UserId == userId)
            ?? throw new KeyNotFoundException("רשומה כספית לא נמצאה.");

        _db.FinancialRecords.Remove(entity);
        await _db.SaveChangesAsync();
    }

    private async Task<IReadOnlyCollection<PayerDebtStatusResponse>> BuildDebtStatusGroupsAsync(int userId, FinancialPaymentStatus status)
    {
        var grouped = await _db.FinancialRecords
            .AsNoTracking()
            .Where(fr => fr.UserId == userId &&
                         fr.Type == FinancialRecordType.Debt &&
                         fr.PaymentStatus == status)
            .GroupBy(fr => fr.PayerName)
            .Select(g => new
            {
                PayerName = g.Key,
                TotalAmount = g.Sum(x => x.Amount),
                RecordCount = g.Count()
            })
            .OrderByDescending(x => x.TotalAmount)
            .ThenBy(x => x.PayerName!)
            .Take(10)
            .ToListAsync();

        return grouped
            .Select(x => new PayerDebtStatusResponse(x.PayerName!, x.TotalAmount, x.RecordCount))
            .ToList();
    }

    private static Expression<Func<FinancialRecord, FinancialRecordResponse>> MapToResponseProjection() =>
        fr => new FinancialRecordResponse(
            fr.Id,
            fr.Type,
            fr.PaymentStatus,
            fr.PayerName,
            fr.Description,
            fr.Amount,
            fr.Date,
            fr.PaymentFor,
            fr.CreatedAt
        );

    private static DateTime NormalizeToUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
