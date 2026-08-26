namespace TaskFlow.Domain.Entities;

public class Project
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public int OwnerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties — EF Core uses these to JOIN tables automatically
    public User Owner { get; set; } = null!;
    public ICollection<TaskItem> Tasks { get; set; } = [];
    public ICollection<ProjectMember> Members { get; set; } = [];
}
