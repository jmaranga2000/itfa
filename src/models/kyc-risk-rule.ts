import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const kycRiskRuleSchema = new Schema(
  {
    rule: { type: String, required: true, trim: true, unique: true, index: true },
    risk: { type: String, enum: ["Standard", "Elevated", "High"], required: true },
    action: { type: String, required: true, trim: true },
    owner: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  },
  {
    collection: "kyc_risk_rules",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

kycRiskRuleSchema.index({ status: 1, risk: 1, rule: 1 });

export type KycRiskRuleDocument = InferSchemaType<typeof kycRiskRuleSchema>;

export const KycRiskRuleModel =
  (mongoose.models.KycRiskRule as Model<KycRiskRuleDocument> | undefined) ??
  mongoose.model<KycRiskRuleDocument>("KycRiskRule", kycRiskRuleSchema);
