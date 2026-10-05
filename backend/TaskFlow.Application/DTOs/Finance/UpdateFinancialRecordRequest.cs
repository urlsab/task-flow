using System.ComponentModel.DataAnnotations;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.DTOs.Finance;

public record UpdateFinancialRecordRequest(
    [Required] FinancialRecordType Type,
    [Required] FinancialPaymentStatus PaymentStatus,
    [Required, MaxLength(120)] string PayerName,
    [Required, MaxLength(400)] string Description,
    [Range(0.01, 999999999)] decimal Amount,
    [Required] DateTime Date,
    [MaxLength(250)] string? PaymentFor
);
