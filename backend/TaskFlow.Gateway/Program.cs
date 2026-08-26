using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── YARP Reverse Proxy ────────────────────────────────────────────────────
// Routes + clusters are defined in appsettings.json under "ReverseProxy".
// YARP handles load balancing, health checks, and header forwarding automatically.
builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// ── JWT Auth (for gateway-level access control) ───────────────────────────
// The gateway validates the JWT and forwards the request unchanged.
// Each downstream service also validates the JWT independently (defence in depth).
var jwtSection = builder.Configuration.GetSection("Jwt");
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtSection["Issuer"],
            ValidAudience            = jwtSection["Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSection["Secret"]!))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
    options.AddPolicy("Angular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

app.UseCors("Angular");
app.UseAuthentication();
app.UseAuthorization();

// Health endpoint — the gateway itself (not proxied)
app.MapGet("/health", () => Results.Ok(new { Service = "gateway", Status = "healthy" }))
   .AllowAnonymous();

// Map all YARP proxy routes — defined in appsettings.json
app.MapReverseProxy();

app.Run();
