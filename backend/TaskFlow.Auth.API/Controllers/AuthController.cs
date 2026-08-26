using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.Auth.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        return CreatedAtAction(nameof(Me), null, result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me() => Ok(new
    {
        UserId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
        Email    = User.FindFirst(ClaimTypes.Email)?.Value,
        FullName = User.FindFirst(ClaimTypes.Name)?.Value
    });

    [HttpGet("health")]
    public IActionResult Health() => Ok(new { Service = "auth-api", Status = "healthy" });
}
