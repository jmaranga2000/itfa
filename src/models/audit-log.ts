import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const auditLogSchema = new Schema(
  {
    actorUserId: { type: Schema.Types.ObjectId, default: null, index: true, immutable: true },
    actorEmail: { type: String, default: null, index: true, immutable: true },
    actorRoleSnapshot: { type: [String], default: [], immutable: true },
    organizationId: { type: Schema.Types.ObjectId, default: null, index: true, immutable: true },
    action: { type: String, required: true, index: true, immutable: true },
    resourceType: { type: String, required: true, index: true, immutable: true },
    resourceId: { type: String, default: null, index: true, immutable: true },
    previousValues: { type: Schema.Types.Mixed, default: null, immutable: true },
    newValues: { type: Schema.Types.Mixed, default: null, immutable: true },
    reason: { type: String, default: null, immutable: true },
    requestId: { type: String, default: null, index: true, immutable: true },
    ipAddress: { type: String, default: null, immutable: true },
    userAgent: { type: String, default: null, immutable: true },
    metadata: { type: Schema.Types.Mixed, default: null, immutable: true },
  },
  {
    collection: "audit_logs",
    timestamps: { createdAt: true, updatedAt: false },
  },
);

function blockAuditMutation() {
  throw new Error("Audit logs are immutable and cannot be updated or deleted.");
}

auditLogSchema.pre("updateOne", blockAuditMutation);
auditLogSchema.pre("updateMany", blockAuditMutation);
auditLogSchema.pre("findOneAndUpdate", blockAuditMutation);
auditLogSchema.pre("deleteOne", blockAuditMutation);
auditLogSchema.pre("deleteMany", blockAuditMutation);
auditLogSchema.pre("findOneAndDelete", blockAuditMutation);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;

export const AuditLogModel =
  (mongoose.models.AuditLog as Model<AuditLogDocument> | undefined) ??
  mongoose.model<AuditLogDocument>("AuditLog", auditLogSchema);
