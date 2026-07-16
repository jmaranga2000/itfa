import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PERMISSIONS } from "@/features/authorization/permissions";

const permissionSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      enum: PERMISSIONS,
      unique: true,
      index: true,
      immutable: true,
    },
    description: { type: String, required: true },
  },
  {
    collection: "permissions",
    timestamps: true,
  },
);

export type PermissionDocument = InferSchemaType<typeof permissionSchema>;

export const PermissionModel =
  (mongoose.models.Permission as Model<PermissionDocument> | undefined) ??
  mongoose.model<PermissionDocument>("Permission", permissionSchema);
