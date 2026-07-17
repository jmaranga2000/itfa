import { createTransport } from "nodemailer";
import { getServerEnv } from "@/lib/env";
import { validateExternalRecipient } from "@/lib/client-recipient";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendNewPortalMessageEmail(input: {
  recipientEmail: string;
  recipientName: string;
  conversationId: string;
  subject: string;
  messagePreview: string;
}) {
  const env = getServerEnv();

  if (!env.GMAIL_SMTP_USER || !env.GMAIL_SMTP_APP_PASSWORD) {
    return { delivered: false, reason: "Gmail SMTP is not configured." };
  }

  const recipient = validateExternalRecipient(input.recipientEmail, env.GMAIL_SMTP_USER);

  if (!recipient.valid) {
    return { delivered: false, reason: recipient.reason };
  }

  const portalUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/client/messages?conversation=${encodeURIComponent(input.conversationId)}`;
  const recipientName = escapeHtml(input.recipientName || "Client");
  const subject = escapeHtml(input.subject);
  const preview = escapeHtml(input.messagePreview.slice(0, 320));

  try {
    const transporter = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: env.GMAIL_SMTP_USER,
        pass: env.GMAIL_SMTP_APP_PASSWORD,
      },
    });

    const result = await transporter.sendMail({
      from: {
        name: "IFTA Consulting",
        address: env.GMAIL_SMTP_USER,
      },
      to: recipient.recipient,
      envelope: {
        from: env.GMAIL_SMTP_USER,
        to: [recipient.recipient],
      },
      subject: `New portal message: ${input.subject}`,
      html: `
        <!doctype html>
        <html>
          <body style="margin:0;background:#f4f7f7;color:#03363D;font-family:Arial,sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f7;padding:32px 16px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #d7e3e2;border-radius:8px;overflow:hidden;">
                    <tr>
                      <td style="background:#03363D;padding:24px 28px;color:#ffffff;">
                        <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#BDD9D7;">IFTA Consulting</p>
                        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;">You have a new portal message</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:28px;">
                        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hello ${recipientName},</p>
                        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#38585c;">An IFTA Consulting team member sent you a message in your secure client portal.</p>
                        <div style="border-left:4px solid #BDD9D7;background:#f5f9f9;padding:16px 18px;">
                          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#03363D;">${subject}</p>
                          <p style="margin:0;font-size:14px;line-height:1.7;color:#4b6568;">${preview}</p>
                        </div>
                        <p style="margin:24px 0;">
                          <a href="${portalUrl}" style="display:inline-block;background:#03363D;color:#ffffff;padding:12px 18px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:700;">Open client portal</a>
                        </p>
                        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7f81;">For privacy, reply inside the portal. Do not send sensitive documents by email.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="border-top:1px solid #e3ebea;padding:18px 28px;font-size:12px;line-height:1.5;color:#718486;">
                        This automated email only lets you know that a secure message is waiting.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return { delivered: true, messageId: result.messageId };
  } catch (error) {
    console.error("Unable to send portal message email.", error);
    return { delivered: false, reason: "Gmail rejected the message." };
  }
}
