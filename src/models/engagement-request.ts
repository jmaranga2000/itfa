import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const requestItemSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, required: true },
    serviceTitle: { type: String, required: true },
    serviceSummary: { type: String, default: "" },
    pricingPlanId: { type: Schema.Types.ObjectId, default: null },
    priceLabel: { type: String, default: "Quotation required" },
    cadence: { type: String, default: "Project" },
    quantity: { type: Number, min: 1, max: 10, default: 1 },
  },
  { _id: false },
);

const requestTimelineSchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    title: { type: String, required: true },
    detail: { type: String, default: "" },
    clientVisible: { type: Boolean, default: true },
  },
  { _id: false },
);

const engagementRequestSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    clientUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true, lowercase: true, trim: true },
    requestType: {
      type: String,
      enum: ["checkout", "quotation"],
      default: "checkout",
      index: true,
    },
    items: { type: [requestItemSchema], required: true, default: [] },
    status: {
      type: String,
      enum: [
        "admin_review",
        "quotation_requested",
        "quotation_preparing",
        "quotation_sent",
        "clarification",
        "approved",
        "rejected",
        "converted",
      ],
      default: "admin_review",
      index: true,
    },
    priority: { type: String, enum: ["medium", "high"], default: "medium" },
    clientNotes: { type: String, default: "" },
    expectedOutcome: { type: String, default: "" },
    adminNotes: { type: String, default: "" },
    quotationAmount: { type: Number, default: null },
    quotationCurrency: { type: String, default: "KES" },
    workflowId: { type: Schema.Types.ObjectId, default: null, index: true },
    submittedAt: { type: Date, default: Date.now, index: true },
    reviewedAt: { type: Date, default: null },
    timeline: { type: [requestTimelineSchema], default: [] },
  },
  {
    collection: "engagement_requests",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

engagementRequestSchema.index({ clientUserId: 1, submittedAt: -1 });
engagementRequestSchema.index({ status: 1, submittedAt: -1 });

export type EngagementRequestDocument = InferSchemaType<typeof engagementRequestSchema>;

export const EngagementRequestModel =
  (mongoose.models.EngagementRequest as Model<EngagementRequestDocument> | undefined) ??
  mongoose.model<EngagementRequestDocument>("EngagementRequest", engagementRequestSchema);
