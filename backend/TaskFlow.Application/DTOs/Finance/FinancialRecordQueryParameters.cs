using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.DTOs.Finance;

public class FinancialRecordQueryParameters
{
    public FinancialRecordType? Type { get; init; }
    public FinancialPaymentStatus? PaymentStatus { get; init; }
    public decimal? MinAmount { get; init; }
    public decimal? MaxAmount { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public string? Search { get; init; }
}
