import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const etimsConfigurationSchema = new Schema(
  {
    singletonKey: { type: String, default: "primary", unique: true, immutable: true },
    enabled: { type: Boolean, default: false, index: true },
    environment: { type: String, enum: ["SANDBOX", "PRODUCTION"], default: "SANDBOX" },
    integrationType: { type: String, enum: ["DIRECT_OSCU", "CERTIFIED_INTEGRATOR"], default: "DIRECT_OSCU" },
    providerName: { type: String, default: "KRA OSCU", trim: true },
    taxpayerPin: { type: String, default: "", uppercase: true, trim: true },
    branchId: { type: String, default: "", trim: true },
    deviceId: { type: String, default: "", trim: true },
    apiBaseUrl: { type: String, default: "", trim: true },
    credentialReference: { type: String, default: "KRA_ETIMS_API_TOKEN", trim: true },
    defaultCurrency: { type: String, default: "KES", uppercase: true, trim: true },
    defaultPaymentType: { type: String, default: "BANK_TRANSFER", trim: true },
    taxRegistered: { type: Boolean, default: true },
    invoicePrefix: { type: String, default: "INV", uppercase: true, trim: true },
    creditNotePrefix: { type: String, default: "CN", uppercase: true, trim: true },
    debitNotePrefix: { type: String, default: "DN", uppercase: true, trim: true },
    maxAttempts: { type: Number, default: 5, min: 1, max: 20 },
    initialRetrySeconds: { type: Number, default: 60, min: 10, max: 86400 },
    reconciliationEnabled: { type: Boolean, default: true },
    reconciliationPath: { type: String, default: "/transactions/reconcile", trim: true },
    salePath: { type: String, default: "/sales", trim: true },
    creditNotePath: { type: String, default: "/credit-notes", trim: true },
    debitNotePath: { type: String, default: "", trim: true },
    debitNoteProductionVerified: { type: Boolean, default: false },
    notificationRecipientUserIds: { type: [Schema.Types.ObjectId], default: [] },
    lastConnectionTestAt: { type: Date, default: null },
    lastConnectionTestSucceeded: { type: Boolean, default: false },
    lastSuccessfulTransactionAt: { type: Date, default: null },
    lastFailedTransactionAt: { type: Date, default: null },
    referenceDataSyncedAt: { type: Date, default: null },
    referenceDataStatus: { type: String, enum: ["NOT_SYNCED", "CURRENT", "FAILED"], default: "NOT_SYNCED" },
    version: { type: Number, default: 1 },
    configuredByUserId: { type: Schema.Types.ObjectId, default: null },
    configuredByName: { type: String, default: "" },
    configuredAt: { type: Date, default: null },
    productionActivatedAt: { type: Date, default: null },
  },
  { collection: "etims_configuration", timestamps: true, optimisticConcurrency: true },
);

export type EtimsConfigurationDocument = InferSchemaType<typeof etimsConfigurationSchema>;
export const EtimsConfigurationModel =
  (mongoose.models.EtimsConfiguration as Model<EtimsConfigurationDocument> | undefined)
  ?? mongoose.model<EtimsConfigurationDocument>("EtimsConfiguration", etimsConfigurationSchema);
