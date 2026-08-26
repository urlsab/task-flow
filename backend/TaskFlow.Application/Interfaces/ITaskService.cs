using TaskFlow.Application.DTOs.Tasks;

namespace TaskFlow.Application.Interfaces;

public interface ITaskService
{
    Task<IEnumerable<TaskResponse>> GetProjectTasksAsync(int projectId, int userId, TaskQueryParameters filters);
    Task<TaskResponse> GetByIdAsync(int id, int userId);
    Task<TaskResponse> CreateAsync(CreateTaskRequest request, int userId);
    Task<TaskResponse> UpdateAsync(int id, UpdateTaskRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
