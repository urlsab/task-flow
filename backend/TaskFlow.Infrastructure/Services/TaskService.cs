using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.DTOs.Tasks;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _db;

    public TaskService(AppDbContext db) => _db = db;

    // IQueryable<T> — the query is described but no SQL runs until ToListAsync/FirstOrDefaultAsync
    private IQueryable<TaskItem> BaseQuery() =>
        _db.Tasks
            .Include(t => t.Project)
            .Include(t => t.Assignee)
            .Include(t => t.CreatedBy);

    // Called after ToListAsync — runs in C# memory, not translated to SQL
    private static TaskResponse ToResponse(TaskItem t) => new(
        t.Id,
        t.Title,
        t.Description,
        t.Status,
        t.Status.ToString(),
        t.Priority,
        t.Priority.ToString(),
        t.DueDate,
        t.ProjectId,
        t.Project.Name,
        t.AssigneeId,
        t.Assignee?.FullName,
        t.CreatedById,
        t.CreatedBy.FullName,
        t.CreatedAt,
        t.UpdatedAt
    );

    public async Task<IEnumerable<TaskResponse>> GetProjectTasksAsync(
        int projectId, int userId, TaskQueryParameters filters)
    {
        var projectExists = await _db.Projects.AnyAsync(p =>
            p.Id == projectId && (p.OwnerId == userId || p.Members.Any(m => m.UserId == userId)));

        if (!projectExists)
            throw new KeyNotFoundException($"Project {projectId} not found.");

        // Each conditional Where() appends an AND clause — still no SQL yet
        IQueryable<TaskItem> query = BaseQuery().Where(t => t.ProjectId == projectId);

        if (filters.Status.HasValue)
            query = query.Where(t => t.Status == filters.Status.Value);

        if (filters.Priority.HasValue)
            query = query.Where(t => t.Priority == filters.Priority.Value);

        if (filters.AssigneeId.HasValue)
            query = query.Where(t => t.AssigneeId == filters.AssigneeId.Value);

        if (!string.IsNullOrWhiteSpace(filters.Search))
            query = query.Where(t => t.Title.Contains(filters.Search));

        // SQL fires here — one round trip with all conditions applied
        var tasks = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return tasks.Select(ToResponse);
    }

    public async Task<TaskResponse> GetByIdAsync(int id, int userId)
    {
        var task = await BaseQuery()
            .FirstOrDefaultAsync(t => t.Id == id &&
                (t.Project.OwnerId == userId || t.Project.Members.Any(m => m.UserId == userId)))
            ?? throw new KeyNotFoundException($"Task {id} not found.");

        return ToResponse(task);
    }

    public async Task<TaskResponse> CreateAsync(CreateTaskRequest request, int userId)
    {
        var hasAccess = await _db.Projects.AnyAsync(p =>
            p.Id == request.ProjectId &&
            (p.OwnerId == userId || p.Members.Any(m => m.UserId == userId)));

        if (!hasAccess)
            throw new KeyNotFoundException($"Project {request.ProjectId} not found.");

        var task = new TaskItem
        {
            Title       = request.Title,
            Description = request.Description,
            ProjectId   = request.ProjectId,
            AssigneeId  = request.AssigneeId,
            Priority    = request.Priority,
            DueDate     = request.DueDate,
            CreatedById = userId
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(task.Id, userId);
    }

    public async Task<TaskResponse> UpdateAsync(int id, UpdateTaskRequest request, int userId)
    {
        var task = await _db.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id &&
                (t.Project.OwnerId == userId || t.Project.Members.Any(m => m.UserId == userId)))
            ?? throw new KeyNotFoundException($"Task {id} not found.");

        task.Title       = request.Title;
        task.Description = request.Description;
        task.Status      = request.Status;
        task.Priority    = request.Priority;
        task.AssigneeId  = request.AssigneeId;
        task.DueDate     = request.DueDate;
        task.UpdatedAt   = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return await GetByIdAsync(id, userId);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var task = await _db.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id &&
                (t.Project.OwnerId == userId || t.Project.Members.Any(m => m.UserId == userId)))
            ?? throw new KeyNotFoundException($"Task {id} not found.");

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();
    }
}
