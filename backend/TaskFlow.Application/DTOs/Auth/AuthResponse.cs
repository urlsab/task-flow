namespace TaskFlow.Application.DTOs.Auth;

public record AuthResponse(
    string Token,
    int UserId,
    string Email,
    string FullName
);
