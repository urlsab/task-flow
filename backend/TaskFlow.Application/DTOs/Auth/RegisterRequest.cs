using System.ComponentModel.DataAnnotations;

namespace TaskFlow.Application.DTOs.Auth;

public record RegisterRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(8), MaxLength(128)] string Password,
    [Required, MaxLength(100)] string FullName
);
