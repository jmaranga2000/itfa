import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const clientDocumentSchema = new Schema(
  {
    clientUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    workflowId: { type: Schema.Types.ObjectId, default: null, index: true },
    requestId: { type: Schema.Types.ObjectId, default: null, index: true },
    engagementLetterId: { type: Schema.Types.ObjectId, default: null, index: true },
    documentKind: {
      type: String,
      enum: ["general", "signed_engagement_letter"],
      default: "general",
      index: true,
    },
    name: { type: String, required: true },
    storageKey: { type: String, required: true, unique: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    direction: { type: String, enum: ["sent", "received"], required: true, index: true },
    status: {
      type: String,
      enum: ["uploaded", "pending_review", "approved", "replacement_requested", "final"],
      default: "pending_review",
      index: true,
    },
    feedback: { type: String, default: "" },
    clientResponse: { type: String, default: "" },
    uploadedByUserId: { type: Schema.Types.ObjectId, required: true },
    uploadedAt: { type: Date, default: Date.now, index: true },
  },
  {
    collection: "client_documents",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

clientDocumentSchema.index({ clientUserId: 1, uploadedAt: -1 });

export type ClientDocumentDocument = InferSchemaType<typeof clientDocumentSchema>;

export const ClientDocumentModel =
  (mongoose.models.ClientDocument as Model<ClientDocumentDocument> | undefined) ??
  mongoose.model<ClientDocumentDocument>("ClientDocument", clientDocumentSchema);
