using TaskFlow.Application.DTOs.Projects;

namespace TaskFlow.Application.Interfaces;

public interface IProjectService
{
    Task<IEnumerable<ProjectResponse>> GetUserProjectsAsync(int userId);
    Task<ProjectResponse> GetByIdAsync(int id, int userId);
    Task<ProjectStatsResponse> GetStatsAsync(int id, int userId);
    Task<ProjectResponse> CreateAsync(CreateProjectRequest request, int userId);
    Task<ProjectResponse> UpdateAsync(int id, UpdateProjectRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
