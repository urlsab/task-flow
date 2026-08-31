using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _db;

    public ProjectService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<ProjectResponse>> GetUserProjectsAsync(int userId)
    {
        // Projection — EF Core translates p.Tasks.Count into a SQL COUNT(*) subquery.
        // No Task rows are loaded into memory; only the aggregate value is fetched.
        return await _db.Projects
            .Where(p => p.OwnerId == userId || p.Members.Any(m => m.UserId == userId))
            .OrderBy(p => p.Name)
            .Select(p => new ProjectResponse(
                p.Id,
                p.Name,
                p.Description,
                p.OwnerId,
                p.Owner.FullName,
                p.CreatedAt,
                p.Tasks.Count
            ))
            .ToListAsync();
    }

    public async Task<ProjectResponse> GetByIdAsync(int id, int userId)
    {
        return await _db.Projects
            .Where(p => p.Id == id && (p.OwnerId == userId || p.Members.Any(m => m.UserId == userId)))
            .Select(p => new ProjectResponse(
                p.Id,
                p.Name,
                p.Description,
                p.OwnerId,
                p.Owner.FullName,
                p.CreatedAt,
                p.Tasks.Count
            ))
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Project {id} not found.");
    }

    public async Task<ProjectStatsResponse> GetStatsAsync(int id, int userId)
    {
        var project = await _db.Projects
            .Where(p => p.Id == id && (p.OwnerId == userId || p.Members.Any(m => m.UserId == userId)))
            .Select(p => new { p.Id, p.Name })
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        // GroupBy → SQL: SELECT Status, COUNT(*) FROM Tasks WHERE ProjectId = @id GROUP BY Status
        var statusCounts = await _db.Tasks
            .Where(t => t.ProjectId == id)
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var now = DateTime.UtcNow;
        int Get(TaskItemStatus s) => statusCounts.FirstOrDefault(c => c.Status == s)?.Count ?? 0;

        return new ProjectStatsResponse(
            ProjectId:       project.Id,
            ProjectName:     project.Name,
            TotalTasks:      statusCounts.Sum(c => c.Count),
            TodoCount:       Get(TaskItemStatus.Todo),
            InProgressCount: Get(TaskItemStatus.InProgress),
            ReviewCount:     Get(TaskItemStatus.Review),
            DoneCount:       Get(TaskItemStatus.Done),
            OverdueTasks:    await _db.Tasks.CountAsync(t =>
                                 t.ProjectId == id &&
                                 t.DueDate < now &&
                                 t.Status != TaskItemStatus.Done)
        );
    }

    public async Task<ProjectResponse> CreateAsync(CreateProjectRequest request, int userId)
    {
        var project = new Project
        {
            Name        = request.Name,
            Description = request.Description,
            OwnerId     = userId,
            // EF Core inserts Project + ProjectMember in one SaveChangesAsync call (same transaction)
            Members     = [new ProjectMember { UserId = userId, Role = ProjectRole.Admin }]
        };

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(project.Id, userId);
    }

    public async Task<ProjectResponse> UpdateAsync(int id, UpdateProjectRequest request, int userId)
    {
        // Only the owner can update — members are read-only on project metadata
        var project = await _db.Projects
            .FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == userId)
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        project.Name        = request.Name;
        project.Description = request.Description;

        await _db.SaveChangesAsync();

        return await GetByIdAsync(id, userId);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var project = await _db.Projects
            .FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == userId)
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        _db.Projects.Remove(project);
        await _db.SaveChangesAsync(); // Cascade deletes Tasks and ProjectMembers via FK rules
    }
}
