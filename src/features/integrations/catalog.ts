export const INTEGRATION_KEYS = [
  "openai",
  "gmail",
  "cloudflare_r2",
  "push_notifications",
  "signed_webhooks",
] as const;

export type IntegrationKey = (typeof INTEGRATION_KEYS)[number];

export const INTEGRATION_CATALOG: Record<IntegrationKey, {
  name: string;
  description: string;
  purpose: string;
  requiredSettings: Array<{ key: string; label: string }>;
}> = {
  openai: {
    name: "OpenAI",
    description: "AI research, analysis, objections, appeals, and drafting.",
    purpose: "Powers the specialist AI workspace and records token activity for administration.",
    requiredSettings: [
      { key: "OPENAI_API_KEY", label: "API key" },
      { key: "OPENAI_DEFAULT_MODEL", label: "Default model" },
    ],
  },
  gmail: {
    name: "Gmail email delivery",
    description: "Verification, messages, quotations, and portal alerts.",
    purpose: "Sends transactional email through the configured Google account and app password.",
    requiredSettings: [
      { key: "GMAIL_SMTP_USER", label: "Sender email" },
      { key: "GMAIL_SMTP_APP_PASSWORD", label: "Google app password" },
    ],
  },
  cloudflare_r2: {
    name: "Cloudflare R2",
    description: "Secure storage for KYC files and client documents.",
    purpose: "Stores uploaded documents outside the application server with private access controls.",
    requiredSettings: [
      { key: "R2_ACCOUNT_ID", label: "Account ID" },
      { key: "R2_ACCESS_KEY_ID", label: "Access key" },
      { key: "R2_SECRET_ACCESS_KEY", label: "Secret key" },
      { key: "R2_BUCKET_NAME", label: "Bucket name" },
    ],
  },
  push_notifications: {
    name: "Push notifications",
    description: "Desktop and mobile alerts for assigned work and messages.",
    purpose: "Notifies subscribed devices when urgent portal activity needs attention.",
    requiredSettings: [
      { key: "NEXT_PUBLIC_VAPID_PUBLIC_KEY", label: "Public VAPID key" },
      { key: "VAPID_PRIVATE_KEY", label: "Private VAPID key" },
      { key: "VAPID_SUBJECT", label: "Notification contact" },
    ],
  },
  signed_webhooks: {
    name: "Signed webhooks",
    description: "Verifies trusted incoming and outgoing system events.",
    purpose: "Protects webhook payloads from tampering by requiring a shared signing secret.",
    requiredSettings: [
      { key: "WEBHOOK_SIGNING_SECRET", label: "Signing secret" },
    ],
  },
};

export function isIntegrationKey(value: string): value is IntegrationKey {
  return (INTEGRATION_KEYS as readonly string[]).includes(value);
}
