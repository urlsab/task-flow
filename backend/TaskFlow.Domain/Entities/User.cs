namespace TaskFlow.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string FullName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Project> OwnedProjects { get; set; } = [];
    public ICollection<ProjectMember> ProjectMemberships { get; set; } = [];
    public ICollection<TaskItem> AssignedTasks { get; set; } = [];
    public ICollection<TaskItem> CreatedTasks { get; set; } = [];
}
