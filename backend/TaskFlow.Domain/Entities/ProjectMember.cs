using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities;

public class ProjectMember
{
    public int ProjectId { get; set; }
    public int UserId { get; set; }
    public ProjectRole Role { get; set; } = ProjectRole.Member;

    public Project Project { get; set; } = null!;
    public User User { get; set; } = null!;
}
