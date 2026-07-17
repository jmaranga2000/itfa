import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { INTEGRATION_KEYS } from "@/features/integrations/catalog";

const integrationConnectionSchema = new Schema(
  {
    key: { type: String, enum: INTEGRATION_KEYS, required: true, unique: true, immutable: true, index: true },
    enabled: { type: Boolean, default: true, index: true },
    status: { type: String, enum: ["not_configured", "ready", "connected", "failed", "disabled"], default: "not_configured", index: true },
    lastCheckedAt: { type: Date, default: null },
    lastCheckedByUserId: { type: Schema.Types.ObjectId, default: null },
    lastError: { type: String, default: "" },
  },
  { collection: "integration_connections", timestamps: true },
);

export type IntegrationConnectionDocument = InferSchemaType<typeof integrationConnectionSchema>;
export const IntegrationConnectionModel =
  (mongoose.models.IntegrationConnection as Model<IntegrationConnectionDocument> | undefined) ??
  mongoose.model<IntegrationConnectionDocument>("IntegrationConnection", integrationConnectionSchema);
