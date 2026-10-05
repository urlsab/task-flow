namespace TaskFlow.Application.DTOs.Auth;

public record AuthResponse(
    string Token,
    int UserId,
    string Username,
    string FullName
);
