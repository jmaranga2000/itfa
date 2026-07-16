import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const catalogStatuses = ["draft", "published", "archived"] as const;

const serviceCatalogSchema = new Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    summary: { type: String, required: true, trim: true },
    inclusions: { type: [String], default: [] },
    bestFor: { type: String, required: true, trim: true },
    outcome: { type: String, required: true, trim: true },
    status: { type: String, enum: catalogStatuses, default: "draft", index: true },
    displayOrder: { type: Number, default: 0, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, default: null },
    updatedByUserId: { type: Schema.Types.ObjectId, default: null },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "service_catalog",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

serviceCatalogSchema.index({ status: 1, displayOrder: 1, title: 1 });

export type ServiceCatalogDocument = InferSchemaType<typeof serviceCatalogSchema>;

export const ServiceCatalogModel =
  (mongoose.models.ServiceCatalog as Model<ServiceCatalogDocument> | undefined) ??
  mongoose.model<ServiceCatalogDocument>("ServiceCatalog", serviceCatalogSchema);
