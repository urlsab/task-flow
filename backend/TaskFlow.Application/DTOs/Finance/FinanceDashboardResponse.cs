namespace TaskFlow.Application.DTOs.Finance;

public record FinanceTotalsResponse(
    decimal Expenses,
    decimal Incomes,
    decimal Donations,
    decimal Receipts,
    decimal Debts,
    decimal PaidDebts,
    decimal PendingDebts
);

public record PayerDebtStatusResponse(
    string PayerName,
    decimal TotalAmount,
    int RecordCount
);

public record FinanceDashboardResponse(
    FinanceTotalsResponse Totals,
    IReadOnlyCollection<PayerDebtStatusResponse> PaidPayers,
    IReadOnlyCollection<PayerDebtStatusResponse> PendingPayers,
    IReadOnlyCollection<FinancialRecordResponse> LatestRecords
);
