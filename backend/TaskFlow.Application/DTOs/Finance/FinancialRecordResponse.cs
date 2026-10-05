using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.DTOs.Finance;

public record FinancialRecordResponse(
    int Id,
    FinancialRecordType Type,
    FinancialPaymentStatus PaymentStatus,
    string PayerName,
    string Description,
    decimal Amount,
    DateTime Date,
    string? PaymentFor,
    DateTime CreatedAt
);
