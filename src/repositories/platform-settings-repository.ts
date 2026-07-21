import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PlatformSettingsModel } from "@/models/platform-settings";

export type PlatformSettingsRecord = {
  company: {
    tradingName: string;
    legalName: string;
    registrationNumber: string;
    kraPin: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    city: string;
    country: string;
  };
  engagement: {
    autoGenerateLetters: boolean;
    requireInternalSignature: boolean;
    allowTypedSignatures: boolean;
    defaultCurrency: string;
    paymentTerms: string;
    governingLaw: string;
    disputeResolution: string;
    signatoryName: string;
    signatoryTitle: string;
    letterValidityDays: number;
    signatureReminderDays: number;
    requireDeliverableApproval: boolean;
  };
  portal: {
    timezone: string;
    supportEmail: string;
    clientWelcomeMessage: string;
    notifyClientOnLetterReady: boolean;
    notifyAdminOnClientSignature: boolean;
  };
  updatedAt: string;
};

const defaults: Omit<PlatformSettingsRecord, "updatedAt"> = {
  company: {
    tradingName: "IFTA Consulting",
    legalName: "IFTA Consulting",
    registrationNumber: "",
    kraPin: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "Nairobi",
    country: "Kenya",
  },
  engagement: {
    autoGenerateLetters: true,
    requireInternalSignature: true,
    allowTypedSignatures: true,
    defaultCurrency: "KES",
    paymentTerms: "Fees are due within 14 days of the invoice date.",
    governingLaw: "Laws of Kenya",
    disputeResolution: "The parties will first attempt to resolve any dispute through good-faith consultation.",
    signatoryName: "Engagement Manager",
    signatoryTitle: "Authorized Signatory",
    letterValidityDays: 14,
    signatureReminderDays: 3,
    requireDeliverableApproval: false,
  },
  portal: {
    timezone: "Africa/Nairobi",
    supportEmail: "",
    clientWelcomeMessage: "Welcome to your IFTA Consulting workspace.",
    notifyClientOnLetterReady: true,
    notifyAdminOnClientSignature: true,
  },
};

type RawSettings = {
  company?: Partial<PlatformSettingsRecord["company"]>;
  engagement?: Partial<PlatformSettingsRecord["engagement"]>;
  portal?: Partial<PlatformSettingsRecord["portal"]>;
  updatedAt?: Date;
};

function serialize(record: RawSettings): PlatformSettingsRecord {
  return {
    company: { ...defaults.company, ...record.company },
    engagement: { ...defaults.engagement, ...record.engagement },
    portal: { ...defaults.portal, ...record.portal },
    updatedAt: record.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  };
}

async function ensureSettings() {
  await connectToDatabase();
  return PlatformSettingsModel.findOneAndUpdate(
    { singletonKey: "global" },
    { $setOnInsert: { singletonKey: "global", ...defaults } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  ).lean().exec();
}

export async function getPlatformSettings() {
  const record = await ensureSettings();
  return serialize(record as unknown as RawSettings);
}

export async function updatePlatformSettingsSection(input: {
  section: "company" | "engagement" | "portal";
  values: Record<string, string | number | boolean>;
  actorUserId: string;
}) {
  await ensureSettings();
  const updates = Object.fromEntries(
    Object.entries(input.values).map(([key, value]) => [`${input.section}.${key}`, value]),
  );
  const actorUserId = Types.ObjectId.isValid(input.actorUserId)
    ? new Types.ObjectId(input.actorUserId)
    : null;
  const record = await PlatformSettingsModel.findOneAndUpdate(
    { singletonKey: "global" },
    { $set: { ...updates, updatedByUserId: actorUserId } },
    { returnDocument: "after", runValidators: true },
  ).lean().exec();
  if (!record) throw new Error("Portal settings could not be saved.");
  return serialize(record as unknown as RawSettings);
}
