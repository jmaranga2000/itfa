import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { createTransport } from "nodemailer";
import webpush from "web-push";
import { Types } from "mongoose";
import { INTEGRATION_CATALOG, INTEGRATION_KEYS, type IntegrationKey } from "@/features/integrations/catalog";
import { getServerEnv } from "@/lib/env";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { IntegrationConnectionModel } from "@/models/integration-connection";

export type IntegrationConnectionRecord = {
  key: IntegrationKey;
  name: string;
  description: string;
  purpose: string;
  enabled: boolean;
  configured: boolean;
  status: "not_configured" | "ready" | "connected" | "failed" | "disabled";
  settings: Array<{ key: string; label: string; configured: boolean }>;
  lastCheckedAt: string | null;
  lastError: string;
};

type RawConnection = {
  key: IntegrationKey;
  enabled?: boolean;
  status?: IntegrationConnectionRecord["status"];
  lastCheckedAt?: Date | null;
  lastError?: string;
};

function settingConfigured(key: string, env: ReturnType<typeof getServerEnv>) {
  return Boolean(env[key as keyof typeof env]);
}

function serialize(record: RawConnection): IntegrationConnectionRecord {
  const catalog = INTEGRATION_CATALOG[record.key];
  const env = getServerEnv();
  const settings = catalog.requiredSettings.map((setting) => ({
    ...setting,
    configured: settingConfigured(setting.key, env),
  }));
  const configured = settings.every((setting) => setting.configured);
  const enabled = record.enabled ?? true;
  return {
    key: record.key,
    name: catalog.name,
    description: catalog.description,
    purpose: catalog.purpose,
    enabled,
    configured,
    status: !enabled ? "disabled" : !configured ? "not_configured" : record.status === "failed" ? "failed" : record.status === "connected" ? "connected" : "ready",
    settings,
    lastCheckedAt: record.lastCheckedAt?.toISOString() ?? null,
    lastError: record.lastError ?? "",
  };
}

async function ensureConnectionRecords() {
  await IntegrationConnectionModel.bulkWrite(INTEGRATION_KEYS.map((key) => ({
    updateOne: {
      filter: { key },
      update: { $setOnInsert: { key, enabled: true, status: "not_configured", lastError: "" } },
      upsert: true,
    },
  })));
}

export async function listIntegrationConnections() {
  await connectToDatabase();
  await ensureConnectionRecords();
  const records = await IntegrationConnectionModel.find({}).sort({ key: 1 }).lean().exec();
  return (records as RawConnection[]).map(serialize).sort((left, right) => left.name.localeCompare(right.name));
}

export async function getIntegrationConnection(key: IntegrationKey) {
  const records = await listIntegrationConnections();
  return records.find((record) => record.key === key) ?? null;
}

export async function setIntegrationEnabled(key: IntegrationKey, enabled: boolean) {
  await connectToDatabase();
  await IntegrationConnectionModel.updateOne(
    { key },
    { $set: { enabled, status: enabled ? "ready" : "disabled", lastError: "" }, $setOnInsert: { key } },
    { upsert: true },
  ).exec();
}

async function runConnectionTest(key: IntegrationKey) {
  const env = getServerEnv();
  if (key === "openai") {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`OpenAI returned status ${response.status}.`);
    return;
  }
  if (key === "gmail") {
    const transporter = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: env.GMAIL_SMTP_USER, pass: env.GMAIL_SMTP_APP_PASSWORD },
    });
    await transporter.verify();
    return;
  }
  if (key === "cloudflare_r2") {
    const configuration = getR2Configuration();
    await getR2Client().send(new HeadBucketCommand({ Bucket: configuration.bucketName }));
    return;
  }
  if (key === "push_notifications") {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT ?? "mailto:notifications@ifta.test",
      env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
      env.VAPID_PRIVATE_KEY ?? "",
    );
    return;
  }
  if (!env.WEBHOOK_SIGNING_SECRET || env.WEBHOOK_SIGNING_SECRET.length < 24) {
    throw new Error("The webhook signing secret must be at least 24 characters.");
  }
}

export async function testIntegrationConnection(key: IntegrationKey, actorUserId: string) {
  const connection = await getIntegrationConnection(key);
  if (!connection) return { success: false, message: "Connection not found." };
  if (!connection.enabled) return { success: false, message: "Enable this connection before testing it." };
  if (!connection.configured) {
    const missing = connection.settings.filter((setting) => !setting.configured).map((setting) => setting.label).join(", ");
    return { success: false, message: `Add the missing settings: ${missing}.` };
  }
  try {
    await runConnectionTest(key);
    await IntegrationConnectionModel.updateOne({ key }, { $set: {
      status: "connected",
      lastCheckedAt: new Date(),
      lastCheckedByUserId: Types.ObjectId.isValid(actorUserId) ? new Types.ObjectId(actorUserId) : null,
      lastError: "",
    } }).exec();
    return { success: true, message: "Connection test passed." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection test failed.";
    await IntegrationConnectionModel.updateOne({ key }, { $set: {
      status: "failed",
      lastCheckedAt: new Date(),
      lastCheckedByUserId: Types.ObjectId.isValid(actorUserId) ? new Types.ObjectId(actorUserId) : null,
      lastError: message.slice(0, 300),
    } }).exec();
    return { success: false, message };
  }
}
