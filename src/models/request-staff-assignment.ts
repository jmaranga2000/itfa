import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const requestStaffAssignmentSchema = new Schema(
  {
    requestId: { type: String, required: true, trim: true, unique: true, index: true },
    staffUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    assignedByUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    assignedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  {
    collection: "request_staff_assignments",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

requestStaffAssignmentSchema.index({ staffUserId: 1, assignedAt: -1 });

export type RequestStaffAssignmentDocument = InferSchemaType<
  typeof requestStaffAssignmentSchema
>;

export const RequestStaffAssignmentModel =
  (mongoose.models.RequestStaffAssignment as
    | Model<RequestStaffAssignmentDocument>
    | undefined) ??
  mongoose.model<RequestStaffAssignmentDocument>(
    "RequestStaffAssignment",
    requestStaffAssignmentSchema,
  );
