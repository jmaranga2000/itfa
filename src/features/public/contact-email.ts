import { getPlatformSettings } from "@/repositories/platform-settings-repository";
import { getServerEnv } from "@/lib/env";
import { sendPortalEmail } from "@/lib/email/smtp";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMultiLineText(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

export type PublicContactDetails = {
  name: string;
  email: string;
  company?: string | null;
  service: string;
  message: string;
};

export async function sendPublicContactEmailToAdmin(details: PublicContactDetails) {
  const settings = await getPlatformSettings();
  const env = getServerEnv();
  const replyTo = details.email.trim();
  const recipientEmail = (settings.portal.supportEmail || settings.company.email || env.GMAIL_SMTP_USER || "").trim();

  if (!recipientEmail) {
    throw new Error("No support email is configured for public contact notifications.");
  }

  const recipientName = recipientEmail === settings.company.email ? settings.company.tradingName : "IFTA Consulting";
  const subject = `New contact enquiry from ${details.name}`;

  return sendPortalEmail({
    recipientEmail,
    subject,
    replyTo,
    text: `New contact enquiry from ${details.name} <${details.email}>\n\nOrganization: ${details.company || "N/A"}\nService area: ${details.service}\n\n${details.message}`,
    html: `<!doctype html><html><body style="margin:0;background:#f4f7f7;color:#03363D;font-family:Arial,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f7;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #d7e3e2;border-radius:8px;overflow:hidden;"><tr><td style="background:#03363D;padding:24px 28px;color:#ffffff;"><p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#BDD9D7;">${escapeHtml(recipientName)}</p><h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;">New public contact enquiry</h1></td></tr><tr><td style="padding:28px;"><p style="margin:0 0 18px;font-size:16px;line-height:1.6;">A new enquiry has been submitted through the public contact page.</p><div style="border-left:4px solid #BDD9D7;background:#f5f9f9;padding:16px 18px;margin-bottom:20px;"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#03363D;">From</p><p style="margin:0;font-size:14px;color:#4b6568;">${escapeHtml(details.name)} &lt;${escapeHtml(details.email)}&gt;</p><p style="margin:8px 0 0;font-size:14px;color:#4b6568;">${escapeHtml(details.company || "Organization not specified")}</p></div><div style="border-left:4px solid #BDD9D7;background:#f5f9f9;padding:16px 18px;margin-bottom:20px;"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#03363D;">Service area</p><p style="margin:0;font-size:14px;color:#4b6568;">${escapeHtml(details.service)}</p></div><div style="border-left:4px solid #03363D;background:#ffffff;padding:16px 18px;margin-bottom:20px;"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#03363D;">Message</p><p style="margin:0;font-size:14px;color:#4b6568;line-height:1.6;">${formatMultiLineText(details.message)}</p></div><p style="margin:0;font-size:13px;line-height:1.6;color:#6b7f81;">Reply to this message in your email client and the response will be sent to the sender.</p></td></tr><tr><td style="border-top:1px solid #e3ebea;padding:18px 28px;font-size:12px;line-height:1.5;color:#718486;">Please do not forward this message to outside parties unless required for service delivery.</td></tr></table></td></tr></table></body></html>`,
  });
}

export async function sendPublicContactReceiptEmailToUser(details: PublicContactDetails) {
  const settings = await getPlatformSettings();
  const env = getServerEnv();
  const supportEmail = (settings.portal.supportEmail || settings.company.email || env.GMAIL_SMTP_USER || "").trim();

  if (!supportEmail) {
    throw new Error("No support email is configured for public contact receipts.");
  }

  const supportName = settings.company.tradingName || "IFTA Consulting";
  const subject = "We have received your IFTA Consulting message";

  return sendPortalEmail({
    recipientEmail: details.email,
    subject,
    replyTo: supportEmail,
    text: `Hello ${details.name},\n\nThank you for contacting IFTA Consulting. We have received your message and will contact you soon.\n\nYour enquiry:\n${details.message}\n\nIf you need to follow up, reply to this email or contact us at ${supportEmail}.\n\nKind regards,\nIFTA Consulting`,
    html: `<!doctype html><html><body style="margin:0;background:#f4f7f7;color:#03363D;font-family:Arial,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f7;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #d7e3e2;border-radius:8px;overflow:hidden;"><tr><td style="background:#03363D;padding:24px 28px;color:#ffffff;"><p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#BDD9D7;">IFTA Consulting</p><h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;">Message received</h1></td></tr><tr><td style="padding:28px;"><p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hello ${escapeHtml(details.name)},</p><p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#38585c;">Thanks for reaching out to IFTA Consulting. We have received your message and someone will contact you soon.</p><div style="border-left:4px solid #BDD9D7;background:#f5f9f9;padding:16px 18px;margin-bottom:20px;"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#03363D;">Your enquiry</p><p style="margin:0;font-size:14px;color:#4b6568;line-height:1.6;">${formatMultiLineText(details.message)}</p></div><p style="margin:0;font-size:14px;line-height:1.7;color:#4b6568;">If you need to follow up before we get back to you, please reply to this email or contact us at <a href="mailto:${escapeHtml(supportEmail)}" style="color:#03363D;text-decoration:underline;">${escapeHtml(supportEmail)}</a>.</p><p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#4b6568;">Kind regards,<br />${escapeHtml(supportName)}</p></td></tr><tr><td style="border-top:1px solid #e3ebea;padding:18px 28px;font-size:12px;line-height:1.5;color:#718486;">This is an automated acknowledgement to confirm receipt of your enquiry.</td></tr></table></td></tr></table></body></html>`,
  });
}
