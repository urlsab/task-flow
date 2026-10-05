using TaskFlow.Application.DTOs.Finance;

namespace TaskFlow.Application.Interfaces;

public interface IFinanceService
{
    Task<FinanceDashboardResponse> GetDashboardAsync(int userId);
    Task<IReadOnlyCollection<FinancialRecordResponse>> GetRecordsAsync(int userId, FinancialRecordQueryParameters query);
    Task<FinancialRecordResponse> GetByIdAsync(int id, int userId);
    Task<FinancialRecordResponse> CreateAsync(int userId, CreateFinancialRecordRequest request);
    Task<FinancialRecordResponse> UpdateAsync(int id, int userId, UpdateFinancialRecordRequest request);
    Task DeleteAsync(int id, int userId);
}
