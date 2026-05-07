using System.Net;
using System.Text;

namespace Flowoff.Infrastructure.Services;

internal static class FlowoffEmailTemplate
{
    public static string Build(
        string eyebrow,
        string title,
        string intro,
        string? details = null,
        string? ctaText = null,
        string? ctaUrl = null,
        string? footnote = null,
        IReadOnlyCollection<(string Label, string Value)>? facts = null)
    {
        var html = new StringBuilder();
        html.Append(
            """
            <!doctype html>
            <html lang="ru">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Flowoff</title>
            </head>
            <body style="margin:0;padding:0;background:#f4f8f4;font-family:'Segoe UI',Arial,sans-serif;color:#1f2a23;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f8f4;padding:24px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
                      <tr>
                        <td style="padding:0 20px 18px 20px;">
                          <div style="font-size:28px;font-weight:700;letter-spacing:0.02em;color:#5f8f72;">Flowoff</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 20px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #e0ebe2;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(34,56,42,0.08);">
                            <tr>
                              <td style="padding:36px 36px 28px 36px;background:linear-gradient(180deg,#f8fcf8 0%,#ffffff 100%);">
            """);

        html.Append($"""
                                <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:#eef6f0;color:#5f8f72;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                                  {Encode(eyebrow)}
                                </div>
                                <h1 style="margin:18px 0 12px 0;font-size:32px;line-height:1.15;font-weight:700;color:#1f2a23;">
                                  {Encode(title)}
                                </h1>
                                <p style="margin:0;font-size:16px;line-height:1.8;color:#425247;">
                                  {Encode(intro)}
                                </p>
            """);

        if (!string.IsNullOrWhiteSpace(details))
        {
            html.Append($"""
                                <p style="margin:14px 0 0 0;font-size:15px;line-height:1.75;color:#5d6d62;">
                                  {Encode(details)}
                                </p>
            """);
        }

        if (facts is { Count: > 0 })
        {
            html.Append(
                """
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-collapse:separate;border-spacing:0 10px;">
                """);

            foreach (var fact in facts)
            {
                html.Append($"""
                                  <tr>
                                    <td style="padding:14px 16px;border:1px solid #e6efe8;border-radius:18px;background:#fbfdfb;">
                                      <div style="font-size:12px;line-height:1.4;color:#7b8a80;text-transform:uppercase;letter-spacing:0.08em;">{Encode(fact.Label)}</div>
                                      <div style="margin-top:6px;font-size:15px;line-height:1.6;color:#1f2a23;font-weight:600;">{Encode(fact.Value)}</div>
                                    </td>
                                  </tr>
                """);
            }

            html.Append("</table>");
        }

        if (!string.IsNullOrWhiteSpace(ctaText) && !string.IsNullOrWhiteSpace(ctaUrl))
        {
            html.Append($"""
                                <div style="margin-top:28px;">
                                  <a href="{EncodeAttribute(ctaUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#6a9c7b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">
                                    {Encode(ctaText)}
                                  </a>
                                </div>
                                <div style="margin-top:14px;font-size:13px;line-height:1.7;color:#75837a;word-break:break-word;">
                                  Если кнопка не открывается, используйте ссылку:<br />
                                  <a href="{EncodeAttribute(ctaUrl)}" style="color:#5f8f72;text-decoration:none;">{Encode(ctaUrl)}</a>
                                </div>
            """);
        }

        if (!string.IsNullOrWhiteSpace(footnote))
        {
            html.Append($"""
                                <p style="margin:26px 0 0 0;font-size:13px;line-height:1.75;color:#7b8a80;">
                                  {Encode(footnote)}
                                </p>
            """);
        }

        html.Append(
            """
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:18px 20px 0 20px;text-align:center;font-size:12px;line-height:1.7;color:#8b9a90;">
                          Flowoff · цветы, букеты и подарки с доставкой
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """);

        return html.ToString();
    }

    private static string Encode(string value) => WebUtility.HtmlEncode(value);

    private static string EncodeAttribute(string value) => WebUtility.HtmlEncode(value);
}
