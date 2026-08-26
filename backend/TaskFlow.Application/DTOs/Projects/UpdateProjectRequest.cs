using System.ComponentModel.DataAnnotations;

namespace TaskFlow.Application.DTOs.Projects;

public record UpdateProjectRequest(
    [Required, MaxLength(100)] string Name,
    [MaxLength(500)] string? Description
);
