import { createTransport } from "nodemailer";
import { getServerEnv } from "@/lib/env";
import { normalizeRecipientEmail, validateExternalRecipient } from "@/lib/client-recipient";

export type EmailDeliveryResult = {
  delivered: boolean;
  recipient: string;
  messageId?: string;
  reason?: string;
};

export async function sendPortalEmail(input: {
  recipientEmail: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<EmailDeliveryResult> {
  const env = getServerEnv();
  const recipient = normalizeRecipientEmail(input.recipientEmail);
  if (!env.GMAIL_SMTP_USER || !env.GMAIL_SMTP_APP_PASSWORD) {
    return { delivered: false, recipient, reason: "Gmail SMTP is not configured." };
  }
  const validation = validateExternalRecipient(recipient, env.GMAIL_SMTP_USER);
  if (!validation.valid) {
    return { delivered: false, recipient, reason: validation.reason };
  }

  try {
    const transporter = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: env.GMAIL_SMTP_USER, pass: env.GMAIL_SMTP_APP_PASSWORD },
    });
    const result = await transporter.sendMail({
      from: { name: "IFTA Consulting", address: env.GMAIL_SMTP_USER },
      to: validation.recipient,
      envelope: { from: env.GMAIL_SMTP_USER, to: [validation.recipient] },
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    const accepted = (result.accepted ?? [])
      .map((address) => normalizeRecipientEmail(String(address)))
      .includes(validation.recipient);
    if (!accepted) {
      return {
        delivered: false,
        recipient: validation.recipient,
        messageId: result.messageId,
        reason: "Gmail did not accept the intended recipient.",
      };
    }
    return { delivered: true, recipient: validation.recipient, messageId: result.messageId };
  } catch (error) {
    console.error("Unable to deliver portal email to the intended recipient.", error);
    return { delivered: false, recipient, reason: "Gmail rejected the message." };
  }
}
