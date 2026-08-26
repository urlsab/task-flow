using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // AnyAsync generates: SELECT CASE WHEN EXISTS(...) THEN 1 ELSE 0 END
        if (await _db.Users.AnyAsync(u => u.Email == request.Email.ToLower()))
            throw new ArgumentException("A user with this email already exists.");

        var user = new User
        {
            Email = request.Email.ToLower(),
            // BCrypt.HashPassword salts + hashes — never store raw passwords
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(); // Issues INSERT, populates user.Id from DB identity

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // We return the same message for wrong email or wrong password — prevents user enumeration
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower())
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        return BuildAuthResponse(user);
    }

    private AuthResponse BuildAuthResponse(User user) =>
        new(GenerateToken(user), user.Id, user.Email, user.FullName);

    private string GenerateToken(User user)
    {
        var jwt = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Secret"]!));

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims:
            [
                // NameIdentifier is the standard claim for a numeric user ID
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName)
            ],
            expires: DateTime.UtcNow.AddHours(double.Parse(jwt["ExpiresInHours"]!)),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
