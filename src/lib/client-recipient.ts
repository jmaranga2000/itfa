export type ClientRecipientProfile = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

const placeholderNames = new Set(["client", "client portal", "portal client"]);

export function clientRecipientName(
  profile: ClientRecipientProfile,
  fallbackName = "Client",
) {
  const accountName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();

  if (accountName && !placeholderNames.has(accountName.toLowerCase())) {
    return accountName;
  }

  const fallback = fallbackName.trim();
  return fallback && !placeholderNames.has(fallback.toLowerCase()) ? fallback : "Client";
}

export function normalizeRecipientEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateExternalRecipient(recipientEmail: string, senderEmail: string) {
  const recipient = normalizeRecipientEmail(recipientEmail);
  const sender = normalizeRecipientEmail(senderEmail);

  if (!recipient || recipient === sender) {
    return { valid: false, recipient, reason: "The client email matches the sender account." };
  }

  if (/@[^@]+\.test$/i.test(recipient)) {
    return { valid: false, recipient, reason: "The selected client uses a demonstration email address." };
  }

  return { valid: true, recipient, reason: "" };
}
