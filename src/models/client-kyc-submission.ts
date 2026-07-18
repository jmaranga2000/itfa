import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const clientKycDocumentSchema = new Schema(
  {
    r2Key: { type: String, required: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    documentType: { type: String, default: "", trim: true },
    documentDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null, index: true },
    version: { type: Number, min: 1, default: 1 },
    checksum: { type: String, default: "", trim: true },
    reviewStatus: {
      type: String,
      enum: ["submitted", "approved", "replacement_requested", "rejected"],
      default: "submitted",
    },
    rejectionReason: { type: String, default: "", trim: true },
  },
  { _id: true },
);

const kycRequirementReviewSchema = new Schema(
  {
    requirementId: { type: String, required: true, trim: true },
    decision: {
      type: String,
      enum: ["approved", "replacement_requested", "escalated", "rejected"],
      required: true,
    },
    note: { type: String, default: "", trim: true },
    reviewedByUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    reviewedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const clientKycSubmissionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true, ref: "User" },
    questionnaireVersion: { type: String, default: "individual-v1" },
    answers: { type: Map, of: String, default: {} },
    questionnaireComplete: { type: Boolean, default: false, index: true },
    documents: { type: [clientKycDocumentSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "changes_requested", "approved"],
      default: "draft",
      index: true,
    },
    submittedAt: { type: Date, default: null },
    assignedReviewerUserId: { type: Schema.Types.ObjectId, default: null, index: true, ref: "User" },
    assignedByUserId: { type: Schema.Types.ObjectId, default: null, ref: "User" },
    assignedAt: { type: Date, default: null },
    requirementReviews: { type: [kycRequirementReviewSchema], default: [] },
  },
  {
    collection: "client_kyc_submissions",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

clientKycSubmissionSchema.index({ status: 1, submittedAt: -1 });
clientKycSubmissionSchema.index({ assignedReviewerUserId: 1, status: 1 });

export type ClientKycSubmissionDocument = InferSchemaType<typeof clientKycSubmissionSchema>;

export const ClientKycSubmissionModel =
  (mongoose.models.ClientKycSubmission as Model<ClientKycSubmissionDocument> | undefined) ??
  mongoose.model<ClientKycSubmissionDocument>("ClientKycSubmission", clientKycSubmissionSchema);
