using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Web.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly IHostEnvironment _environment;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (InvalidOperationException exception)
        {
            _logger.LogWarning(exception, "Business validation failed.");
            await WriteErrorAsync(context, HttpStatusCode.BadRequest, exception.Message);
        }
        catch (DbUpdateException exception)
        {
            _logger.LogError(exception, "Database update failed.");

            var message = _environment.IsDevelopment()
                ? exception.InnerException?.Message ?? exception.Message
                : "Internal server error.";

            await WriteErrorAsync(context, HttpStatusCode.InternalServerError, message);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled exception.");

            var message = _environment.IsDevelopment()
                ? exception.InnerException?.Message ?? exception.Message
                : "Internal server error.";

            await WriteErrorAsync(context, HttpStatusCode.InternalServerError, message);
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, HttpStatusCode statusCode, string message)
    {
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var payload = JsonSerializer.Serialize(new
        {
            error = message
        });

        await context.Response.WriteAsync(payload);
    }
}
