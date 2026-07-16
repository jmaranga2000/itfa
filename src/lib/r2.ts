import { S3Client } from "@aws-sdk/client-s3";
import { getServerEnv } from "@/lib/env";

export function getR2Configuration() {
  const env = getServerEnv();

  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
    throw new Error("Cloudflare R2 is not fully configured.");
  }

  return {
    bucketName: env.R2_BUCKET_NAME,
    endpoint: env.R2_ENDPOINT || `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
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
