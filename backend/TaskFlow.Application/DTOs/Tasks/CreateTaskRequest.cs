using System.ComponentModel.DataAnnotations;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs.Tasks;

public record CreateTaskRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    [Required] int ProjectId,
    int? AssigneeId,
    TaskPriority Priority = TaskPriority.Medium,
    DateTime? DueDate = null
);
