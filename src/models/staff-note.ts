import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const STAFF_NOTE_CATEGORIES = [
  "general",
  "client_call",
  "research",
  "decision",
  "risk",
  "handover",
] as const;

const staffNoteSchema = new Schema(
  {
    workflowId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "WorkflowInstance" },
    clientUserId: { type: Schema.Types.ObjectId, default: null, index: true, ref: "User" },
    authorUserId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    authorName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    category: { type: String, enum: STAFF_NOTE_CATEGORIES, default: "general", index: true },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "staff_notes",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

staffNoteSchema.index({ workflowId: 1, updatedAt: -1 });
staffNoteSchema.index({ authorUserId: 1, updatedAt: -1 });

export type StaffNoteDocument = InferSchemaType<typeof staffNoteSchema>;

export const StaffNoteModel =
  (mongoose.models.StaffNote as Model<StaffNoteDocument> | undefined) ??
  mongoose.model<StaffNoteDocument>("StaffNote", staffNoteSchema);
