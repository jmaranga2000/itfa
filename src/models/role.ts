import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PERMISSIONS } from "@/features/authorization/permissions";
import { APP_ROLES } from "@/features/authorization/roles";

const roleSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      enum: APP_ROLES,
      unique: true,
      index: true,
      immutable: true,
    },
    label: { type: String, required: true },
    description: { type: String, required: true },
    permissions: {
      type: [String],
      required: true,
      enum: PERMISSIONS,
      default: [],
    },
    systemManaged: { type: Boolean, default: true, index: true },
  },
  {
    collection: "roles",
    timestamps: true,
  },
);

export type RoleDocument = InferSchemaType<typeof roleSchema>;

export const RoleModel =
  (mongoose.models.Role as Model<RoleDocument> | undefined) ??
  mongoose.model<RoleDocument>("Role", roleSchema);
