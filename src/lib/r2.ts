import { S3Client } from "@aws-sdk/client-s3";
import { getServerEnv } from "@/lib/env";

export function resolveR2Endpoint(accountId: string, configuredEndpoint?: string) {
  const accountEndpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const endpoint = configuredEndpoint?.trim();

  if (!endpoint) return accountEndpoint;

  let hostname: string;
  try {
    hostname = new URL(endpoint).hostname;
  } catch {
    throw new Error("R2_ENDPOINT must be a valid HTTPS URL.");
  }

  // Public r2.dev delivery URLs do not implement the S3 API.
  if (hostname.endsWith(".r2.dev")) return accountEndpoint;
  return endpoint.replace(/\/$/, "");
}

export function getR2Configuration() {
  const env = getServerEnv();

  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
    throw new Error("Cloudflare R2 is not fully configured.");
  }

  return {
    bucketName: env.R2_BUCKET_NAME,
    endpoint: resolveR2Endpoint(env.R2_ACCOUNT_ID, env.R2_ENDPOINT),
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  };
}

export function getR2Client() {
  const configuration = getR2Configuration();

  return new S3Client({
    region: "auto",
    endpoint: configuration.endpoint,
    credentials: configuration.credentials,
  });
}
