using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs.Tasks;

public record TaskResponse(
    int Id,
    string Title,
    string? Description,
    TaskItemStatus Status,
    string StatusLabel,
    TaskPriority Priority,
    string PriorityLabel,
    DateTime? DueDate,
    int ProjectId,
    string ProjectName,
    int? AssigneeId,
    string? AssigneeName,
    int CreatedById,
    string CreatedByName,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
