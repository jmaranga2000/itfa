import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const kycTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    clientType: { type: String, required: true, trim: true, index: true },
    requirements: { type: Number, required: true, min: 0 },
    mandatory: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Draft", "Published", "Review", "Archived"],
      default: "Draft",
      index: true,
    },
    owner: { type: String, required: true, trim: true },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "kyc_templates",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

kycTemplateSchema.index({ status: 1, clientType: 1, name: 1 });

export type KycTemplateDocument = InferSchemaType<typeof kycTemplateSchema>;

export const KycTemplateModel =
  (mongoose.models.KycTemplate as Model<KycTemplateDocument> | undefined) ??
  mongoose.model<KycTemplateDocument>("KycTemplate", kycTemplateSchema);
