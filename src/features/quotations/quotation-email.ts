import { createTransport } from "nodemailer";
import { getServerEnv } from "@/lib/env";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function money(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function sendQuotationEmail(input: {
  quotationId: string;
  number: string;
  recipientEmail: string;
  recipientName: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil: Date;
  lines: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  notes: string;
  terms: string;
}) {
  const env = getServerEnv();
  if (!env.GMAIL_SMTP_USER || !env.GMAIL_SMTP_APP_PASSWORD) return { delivered: false, reason: "Gmail SMTP is not configured." };
  const portalUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/client/quotations/${input.quotationId}`;
  const logoUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/icons/icon-192.png`;
  const lineRows = input.lines.map((line) => `<tr><td style="padding:12px;border-bottom:1px solid #dce8e7;color:#03363D;">${escapeHtml(line.description)}</td><td align="center" style="padding:12px;border-bottom:1px solid #dce8e7;">${line.quantity}</td><td align="right" style="padding:12px;border-bottom:1px solid #dce8e7;">${money(line.unitPrice, input.currency)}</td><td align="right" style="padding:12px;border-bottom:1px solid #dce8e7;font-weight:700;">${money(line.total, input.currency)}</td></tr>`).join("");
  const transporter = createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: env.GMAIL_SMTP_USER, pass: env.GMAIL_SMTP_APP_PASSWORD } });
  try {
    const result = await transporter.sendMail({
      from: { name: "IFTA Consulting", address: env.GMAIL_SMTP_USER },
      to: input.recipientEmail.trim().toLowerCase(),
      subject: `IFTA quotation ${input.number}`,
      html: `<!doctype html><html><body style="margin:0;background:#eef5f4;font-family:Arial,sans-serif;color:#03363D;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#fff;border:1px solid #cfe0df;border-radius:8px;overflow:hidden;"><tr><td style="background:#03363D;padding:26px 30px;color:#fff;"><table width="100%"><tr><td><img src="${logoUrl}" alt="IFTA Consulting" width="52" height="52" style="display:block;border-radius:6px;background:#fff;"></td><td align="right"><p style="margin:0;color:#BDD9D7;font-size:12px;font-weight:700;">QUOTATION</p><h1 style="margin:6px 0 0;font-size:24px;">${escapeHtml(input.number)}</h1></td></tr></table></td></tr><tr><td style="padding:28px 30px;"><p style="margin:0 0 6px;font-size:16px;">Prepared for <strong>${escapeHtml(input.recipientName)}</strong></p><p style="margin:0 0 24px;color:#557174;font-size:13px;">Valid until ${input.validUntil.toLocaleDateString("en-KE", { dateStyle: "long" })}</p><table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dce8e7;border-radius:6px;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#BDD9D7;"><th align="left" style="padding:12px;">Service</th><th style="padding:12px;">Qty</th><th align="right" style="padding:12px;">Rate</th><th align="right" style="padding:12px;">Amount</th></tr></thead><tbody>${lineRows}</tbody></table><table width="100%" style="margin-top:18px;font-size:14px;"><tr><td></td><td width="240"><table width="100%"><tr><td style="padding:5px;">Subtotal</td><td align="right">${money(input.subtotal, input.currency)}</td></tr><tr><td style="padding:5px;">Tax (${input.taxRate}%)</td><td align="right">${money(input.taxAmount, input.currency)}</td></tr><tr><td style="padding:12px 5px;border-top:2px solid #03363D;font-size:17px;font-weight:700;">Total</td><td align="right" style="border-top:2px solid #03363D;font-size:17px;font-weight:700;">${money(input.total, input.currency)}</td></tr></table></td></tr></table>${input.notes ? `<div style="margin-top:22px;padding:16px;background:#f3f8f7;border-left:4px solid #BDD9D7;font-size:13px;line-height:1.7;"><strong>Notes</strong><br>${escapeHtml(input.notes)}</div>` : ""}<p style="margin:24px 0 0;"><a href="${portalUrl}" style="display:inline-block;background:#03363D;color:#fff;padding:13px 20px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Review and accept quotation</a></p></td></tr><tr><td style="background:#BDD9D7;padding:18px 30px;font-size:12px;line-height:1.6;color:#244c51;"><strong>IFTA Consulting (K) Ltd</strong><br>Nairobi, Kenya | Tax, legal, finance and regulatory advisory<br>${escapeHtml(input.terms)}</td></tr></table></td></tr></table></body></html>`,
    });
    return { delivered: true, messageId: result.messageId };
  } catch (error) {
    console.error("Unable to send quotation email.", error);
    return { delivered: false, reason: "The email provider rejected the quotation." };
  }
}
