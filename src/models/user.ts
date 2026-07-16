import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PERMISSIONS } from "@/features/authorization/permissions";
import { APP_ROLES } from "@/features/authorization/roles";

const userSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "invited", "suspended", "archived"],
      default: "active",
      index: true,
    },
    roleKeys: {
      type: [String],
      enum: APP_ROLES,
      default: ["client"],
      index: true,
    },
    directPermissions: {
      type: [String],
      enum: PERMISSIONS,
      default: [],
    },
    clientOrganizationIds: {
      type: [Schema.Types.ObjectId],
      default: [],
      index: true,
    },
    assignedEngagementIds: {
      type: [Schema.Types.ObjectId],
      default: [],
      index: true,
    },
    archivedAt: { type: Date, default: null },
  },
  {
    collection: "users",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

userSchema.index({ email: 1, status: 1 });

export type UserDocument = InferSchemaType<typeof userSchema>;

export const UserModel =
  (mongoose.models.User as Model<UserDocument> | undefined) ??
  mongoose.model<UserDocument>("User", userSchema);
