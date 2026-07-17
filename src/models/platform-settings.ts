import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const companyProfileSchema = new Schema(
  {
    tradingName: { type: String, default: "IFTA Consulting", trim: true },
    legalName: { type: String, default: "IFTA Consulting", trim: true },
    registrationNumber: { type: String, default: "", trim: true },
    kraPin: { type: String, default: "", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "Nairobi", trim: true },
    country: { type: String, default: "Kenya", trim: true },
  },
  { _id: false },
);

const engagementDefaultsSchema = new Schema(
  {
    autoGenerateLetters: { type: Boolean, default: true },
    requireInternalSignature: { type: Boolean, default: true },
    allowTypedSignatures: { type: Boolean, default: true },
    defaultCurrency: { type: String, default: "KES", trim: true, uppercase: true },
    paymentTerms: { type: String, default: "Fees are due within 14 days of the invoice date.", trim: true },
    governingLaw: { type: String, default: "Laws of Kenya", trim: true },
    disputeResolution: { type: String, default: "The parties will first attempt to resolve any dispute through good-faith consultation.", trim: true },
    signatoryName: { type: String, default: "Engagement Manager", trim: true },
    signatoryTitle: { type: String, default: "Authorized Signatory", trim: true },
    letterValidityDays: { type: Number, default: 14, min: 1, max: 90 },
    signatureReminderDays: { type: Number, default: 3, min: 1, max: 30 },
  },
  { _id: false },
);

const portalPreferencesSchema = new Schema(
  {
    timezone: { type: String, default: "Africa/Nairobi", trim: true },
    supportEmail: { type: String, default: "", lowercase: true, trim: true },
    clientWelcomeMessage: { type: String, default: "Welcome to your IFTA Consulting workspace.", trim: true },
    notifyClientOnLetterReady: { type: Boolean, default: true },
    notifyAdminOnClientSignature: { type: Boolean, default: true },
  },
  { _id: false },
);

const platformSettingsSchema = new Schema(
  {
    singletonKey: { type: String, default: "global", unique: true, immutable: true },
    company: { type: companyProfileSchema, default: () => ({}) },
    engagement: { type: engagementDefaultsSchema, default: () => ({}) },
    portal: { type: portalPreferencesSchema, default: () => ({}) },
    updatedByUserId: { type: Schema.Types.ObjectId, default: null },
  },
  { collection: "platform_settings", timestamps: true, optimisticConcurrency: true },
);

export type PlatformSettingsDocument = InferSchemaType<typeof platformSettingsSchema>;
export const PlatformSettingsModel =
  (mongoose.models.PlatformSettings as Model<PlatformSettingsDocument> | undefined) ??
  mongoose.model<PlatformSettingsDocument>("PlatformSettings", platformSettingsSchema);
