using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TaskFlow.Application.Interfaces;
using TaskFlow.Infrastructure.Data;
using TaskFlow.Infrastructure.Services;

namespace TaskFlow.Infrastructure.Extensions;

// Extension method keeps Program.cs clean — same pattern you'd use in Node with app.use()
public static class InfrastructureServiceExtensions
{
    // Full registration — used by the original monolith (TaskFlow.API)
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        AddDbContext(services, configuration);
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<ITaskService, TaskService>();
        return services;
    }

    // Auth microservice — only registers AuthService
    public static IServiceCollection AddAuthInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        AddDbContext(services, configuration);
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }

    // Projects microservice — only registers ProjectService + TaskService
    public static IServiceCollection AddProjectsInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        AddDbContext(services, configuration);
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<ITaskService, TaskService>();
        return services;
    }

    private static void AddDbContext(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
            options.EnableSensitiveDataLogging(
                sensitiveDataLoggingEnabled: Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development"
            );
        });
    }
}
