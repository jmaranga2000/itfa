import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const pricingStatuses = ["draft", "published", "archived"] as const;

const pricingPlanSchema = new Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    priceLabel: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    cadence: { type: String, required: true, trim: true },
    features: { type: [String], default: [] },
    serviceId: { type: Schema.Types.ObjectId, default: null, index: true },
    featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: pricingStatuses, default: "draft", index: true },
    displayOrder: { type: Number, default: 0, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, default: null },
    updatedByUserId: { type: Schema.Types.ObjectId, default: null },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "pricing_plans",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

pricingPlanSchema.index({ status: 1, displayOrder: 1, name: 1 });

export type PricingPlanDocument = InferSchemaType<typeof pricingPlanSchema>;

export const PricingPlanModel =
  (mongoose.models.PricingPlan as Model<PricingPlanDocument> | undefined) ??
  mongoose.model<PricingPlanDocument>("PricingPlan", pricingPlanSchema);
