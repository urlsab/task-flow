using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TaskFlow.Notifications.API.Consumers;
using TaskFlow.Notifications.API.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "TaskFlow Notifications API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization", Type = SecuritySchemeType.Http,
        Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Own DbContext — only owns the Notifications table
builder.Services.AddDbContext<NotificationsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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

// MassTransit — this service only consumes events, never publishes
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<TaskCreatedConsumer>();
    x.AddConsumer<TaskStatusChangedConsumer>();
    x.AddConsumer<TaskAssignedConsumer>();

    x.UsingRabbitMq((ctx, cfg) =>
    {
        var rabbit = builder.Configuration.GetSection("RabbitMQ");
        cfg.Host(rabbit["Host"] ?? "localhost", rabbit["VirtualHost"] ?? "/", h =>
        {
            h.Username(rabbit["Username"] ?? "guest");
            h.Password(rabbit["Password"] ?? "guest");
        });

        // Each consumer gets its own durable queue — messages survive RabbitMQ restarts
        cfg.ReceiveEndpoint("notifications-task-created", e =>
            e.ConfigureConsumer<TaskCreatedConsumer>(ctx));

        cfg.ReceiveEndpoint("notifications-status-changed", e =>
            e.ConfigureConsumer<TaskStatusChangedConsumer>(ctx));

        cfg.ReceiveEndpoint("notifications-task-assigned", e =>
            e.ConfigureConsumer<TaskAssignedConsumer>(ctx));
    });
});

builder.Services.AddCors(options =>
    options.AddPolicy("Gateway", policy =>
        policy.WithOrigins(
                "http://localhost:5000",
                "http://gateway:5000",
                "http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Notifications API v1"));
}

app.UseCors("Gateway");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// EnsureCreated is fine here since this service manages its own schema (Notifications table only)
using (var scope = app.Services.CreateScope())
{
    try
    {
        scope.ServiceProvider.GetRequiredService<NotificationsDbContext>().Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        scope.ServiceProvider
            .GetRequiredService<ILogger<Program>>()
            .LogError(ex, "Notifications service: database init failed");
    }
}

app.Run();
