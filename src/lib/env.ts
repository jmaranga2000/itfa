import { z } from "zod";
import { ConfigurationError } from "@/lib/errors";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("IFTA Consulting Client Portal"),
});

export const serverEnvSchema = publicEnvSchema.extend({
  MONGODB_URI: z.string().min(1),
  AUTH_SESSION_DAYS: z.coerce.number().int().positive().default(14),
  EMAIL_VERIFICATION_TOKEN_HOURS: z.coerce.number().int().positive().default(24),
  PASSWORD_PEPPER: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_DEFAULT_MODEL: z.string().optional(),
  GMAIL_SMTP_USER: z.string().email().optional(),
  GMAIL_SMTP_APP_PASSWORD: z.string().min(1).optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  WEBHOOK_SIGNING_SECRET: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let publicEnvCache: PublicEnv | null = null;
let serverEnvCache: ServerEnv | null = null;

function parseEnv<T>(schema: z.ZodType<T>, source: NodeJS.ProcessEnv): T {
  const result = schema.safeParse(source);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => issue.path.join(".") || "environment")
      .join(", ");
    throw new ConfigurationError(`Invalid environment configuration: ${missing}`);
  }

  return result.data;
}

export function getPublicEnv() {
  publicEnvCache ??= parseEnv(publicEnvSchema, process.env);
  return publicEnvCache;
}

export function getServerEnv() {
  serverEnvCache ??= parseEnv(serverEnvSchema, process.env);
  return serverEnvCache;
}
