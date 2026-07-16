import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const clientKycDocumentSchema = new Schema(
  {
    r2Key: { type: String, required: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
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
  },
  {
    collection: "client_kyc_submissions",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

clientKycSubmissionSchema.index({ status: 1, submittedAt: -1 });

export type ClientKycSubmissionDocument = InferSchemaType<typeof clientKycSubmissionSchema>;

export const ClientKycSubmissionModel =
  (mongoose.models.ClientKycSubmission as Model<ClientKycSubmissionDocument> | undefined) ??
  mongoose.model<ClientKycSubmissionDocument>("ClientKycSubmission", clientKycSubmissionSchema);
