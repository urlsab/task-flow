using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs.Tasks;

// Bound from query string: ?status=1&priority=2&search=fix&assigneeId=5
public class TaskQueryParameters
{
    public TaskItemStatus? Status { get; set; }
    public TaskPriority? Priority { get; set; }
    public string? Search { get; set; }
    public int? AssigneeId { get; set; }
}
