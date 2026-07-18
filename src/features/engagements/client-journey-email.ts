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

export async function sendClientJourneyEmail(input: {
  recipientEmail: string;
  recipientName: string;
  title: string;
  summary: string;
  actionLabel: string;
  actionPath: string;
}) {
  const env = getServerEnv();
  if (!env.GMAIL_SMTP_USER || !env.GMAIL_SMTP_APP_PASSWORD) {
    return { delivered: false, reason: "Gmail SMTP is not configured." };
  }
  const recipient = validateExternalRecipient(input.recipientEmail, env.GMAIL_SMTP_USER);
  if (!recipient.valid) return { delivered: false, reason: recipient.reason };
  const actionUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${input.actionPath}`;
  const title = escapeHtml(input.title);
  const summary = escapeHtml(input.summary);
  const recipientName = escapeHtml(input.recipientName || "Client");
  try {
    const transporter = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: env.GMAIL_SMTP_USER, pass: env.GMAIL_SMTP_APP_PASSWORD },
    });
    const result = await transporter.sendMail({
      from: { name: "IFTA Consulting", address: env.GMAIL_SMTP_USER },
      to: recipient.recipient,
      envelope: { from: env.GMAIL_SMTP_USER, to: [recipient.recipient] },
      subject: input.title,
      html: `<!doctype html><html><body style="margin:0;background:#f2f7f6;color:#03363D;font-family:Arial,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #BDD9D7;border-radius:8px;overflow:hidden;"><tr><td style="background:#03363D;padding:26px 30px;color:#fff;"><p style="margin:0;color:#BDD9D7;font-size:12px;font-weight:700;text-transform:uppercase;">IFTA Consulting</p><h1 style="margin:10px 0 0;font-size:24px;line-height:1.35;">${title}</h1></td></tr><tr><td style="padding:30px;"><p style="margin:0 0 18px;font-size:16px;">Hello ${recipientName},</p><div style="border-left:4px solid #BDD9D7;background:#f5f9f9;padding:18px;"><p style="margin:0;font-size:15px;line-height:1.7;color:#38585c;">${summary}</p></div><p style="margin:24px 0;"><a href="${actionUrl}" style="display:inline-block;background:#03363D;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:700;">${escapeHtml(input.actionLabel)}</a></p><p style="margin:0;font-size:13px;line-height:1.6;color:#6b7f81;">Sign in to your secure portal to view the full update and complete any required action.</p></td></tr><tr><td style="border-top:1px solid #e3ebea;padding:18px 30px;font-size:12px;color:#718486;">This is an automated service update from IFTA Consulting.</td></tr></table></td></tr></table></body></html>`,
    });
    return { delivered: true, messageId: result.messageId };
  } catch (error) {
    console.error("Unable to send the client journey email.", error);
    return { delivered: false, reason: "Gmail rejected the message." };
  }
}
