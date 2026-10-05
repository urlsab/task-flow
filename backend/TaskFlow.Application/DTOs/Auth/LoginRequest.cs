using System.ComponentModel.DataAnnotations;

namespace TaskFlow.Application.DTOs.Auth;

public record LoginRequest(
    [Required, MinLength(3), MaxLength(50)] string Username,
    [Required] string Password
);
