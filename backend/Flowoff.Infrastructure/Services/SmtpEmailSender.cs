using System.Net;
using System.Net.Mail;
using Flowoff.Application.Interfaces;
using Flowoff.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Flowoff.Infrastructure.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly ILogger<SmtpEmailSender> _logger;
    private readonly SmtpOptions _options;

    public SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _logger = logger;
        _options = options.Value;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.Host) || string.IsNullOrWhiteSpace(_options.FromEmail))
        {
            if (_options.UseLoggingFallbackWhenNotConfigured)
            {
                _logger.LogWarning(
                    "SMTP is not configured. Email was not sent and was written to logs instead. To: {ToEmail}. Subject: {Subject}. Body: {Body}",
                    toEmail,
                    subject,
                    htmlBody);

                return;
            }

            throw new InvalidOperationException("SMTP settings are not configured.");
        }

        using var message = new MailMessage
        {
            From = string.IsNullOrWhiteSpace(_options.FromName)
                ? new MailAddress(_options.FromEmail)
                : new MailAddress(_options.FromEmail, _options.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(new MailAddress(toEmail));

        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false
        };

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            client.Credentials = new NetworkCredential(_options.Username, _options.Password);
        }

        try
        {
            await client.SendMailAsync(message, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Failed to send email via SMTP. To: {ToEmail}. Subject: {Subject}",
                toEmail,
                subject);

            throw new InvalidOperationException("Failed to send email.", exception);
        }
    }
}
