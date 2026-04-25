using Flowoff.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Flowoff.Infrastructure.Services;

public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Email stub. To: {ToEmail}. Subject: {Subject}. Body: {Body}",
            toEmail,
            subject,
            htmlBody);

        return Task.CompletedTask;
    }
}
