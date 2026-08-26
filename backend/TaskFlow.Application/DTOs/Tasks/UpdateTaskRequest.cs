using System.ComponentModel.DataAnnotations;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs.Tasks;

public record UpdateTaskRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    TaskItemStatus Status,
    TaskPriority Priority,
    int? AssigneeId,
    DateTime? DueDate
);
