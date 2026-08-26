using System.Net;
using System.Text.Json;

namespace TaskFlow.API.Middleware;

// Middleware sits in the ASP.NET Core pipeline — every request passes through it.
// This is equivalent to Express error-handling middleware: app.use((err, req, res, next) => ...)
public class GlobalExceptionHandler
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorResponse(context, ex);
        }
    }

    private static async Task WriteErrorResponse(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = ex switch
        {
            KeyNotFoundException    => (int)HttpStatusCode.NotFound,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            ArgumentException       => (int)HttpStatusCode.BadRequest,
            _                       => (int)HttpStatusCode.InternalServerError
        };

        var body = JsonSerializer.Serialize(new
        {
            error = ex.Message,
            statusCode = context.Response.StatusCode
        });

        await context.Response.WriteAsync(body);
    }
}
