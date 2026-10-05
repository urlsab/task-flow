namespace TaskFlow.Domain.Entities;

public enum FinancialRecordType
{
    Expense = 1,
    Income = 2,
    Donation = 3,
    Receipt = 4,
    Debt = 5
}

public enum FinancialPaymentStatus
{
    Pending = 1,
    Paid = 2
}

public class FinancialRecord
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public FinancialRecordType Type { get; set; }
    public FinancialPaymentStatus PaymentStatus { get; set; }
    public required string PayerName { get; set; }
    public required string Description { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? PaymentFor { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
