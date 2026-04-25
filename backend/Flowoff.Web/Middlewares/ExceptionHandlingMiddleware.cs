using System.Net;
using System.Text.Json;

namespace Flowoff.Web.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
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
        catch (InvalidOperationException exception)
        {
            _logger.LogWarning(exception, "Business validation failed.");
            await WriteErrorAsync(context, HttpStatusCode.BadRequest, exception.Message);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled exception.");
            await WriteErrorAsync(context, HttpStatusCode.InternalServerError, "Internal server error.");
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
