using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public AdminController(AppDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public IActionResult Login([FromBody] AdminLoginRequest request)
    {
        var configuredUsername = _configuration["AdminPortal:Username"]?.Trim();
        var configuredPassword = _configuration["AdminPortal:Password"];

        if (string.IsNullOrWhiteSpace(configuredUsername) || string.IsNullOrWhiteSpace(configuredPassword))
            throw new InvalidOperationException("Admin portal credentials are not configured.");

        var normalizedUsername = request.Username.Trim();
        if (!string.Equals(normalizedUsername, configuredUsername, StringComparison.Ordinal) ||
            !string.Equals(request.Password, configuredPassword, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("פרטי מנהל שגויים.");
        }

        return Ok(new AdminAuthResponse(GenerateAdminToken(configuredUsername)));
    }

    [HttpGet("users")]
    [Authorize(Policy = "AdminPortalOnly")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserResponse(u.Id, u.Username, u.FullName, u.CreatedAt))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("users")]
    [Authorize(Policy = "AdminPortalOnly")]
    public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserRequest request)
    {
        var normalizedUsername = request.Username.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Username == normalizedUsername))
            throw new ArgumentException("שם משתמש זה כבר קיים.");

        var user = new User
        {
            Username = normalizedUsername,
            FullName = request.FullName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUsers), null, new AdminUserResponse(user.Id, user.Username, user.FullName, user.CreatedAt));
    }

    [HttpDelete("users/{id:int}")]
    [Authorize(Policy = "AdminPortalOnly")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException("משתמש לא נמצא.");

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private string GenerateAdminToken(string username)
    {
        var jwt = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Secret"]!));

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims:
            [
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, "AdminPortal")
            ],
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record AdminAuthResponse(string Token);

public record AdminUserResponse(
    int Id,
    string Username,
    string FullName,
    DateTime CreatedAt
);

public record AdminLoginRequest(
    [Required, MinLength(3), MaxLength(64)] string Username,
    [Required, MinLength(4), MaxLength(256)] string Password
);

public record AdminCreateUserRequest(
    [Required, MinLength(3), MaxLength(50)] string Username,
    [Required, MinLength(8), MaxLength(128)] string Password,
    [Required, MaxLength(100)] string FullName
);
