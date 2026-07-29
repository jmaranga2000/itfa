import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const etimsServiceMappingSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
    serviceTitle: { type: String, required: true, trim: true },
    itemType: { type: String, enum: ["SERVICE"], default: "SERVICE" },
    itemCode: { type: String, default: "", trim: true },
    classificationCode: { type: String, default: "", trim: true },
    taxTypeCode: { type: String, required: true, trim: true },
    taxRate: { type: Number, required: true, min: 0 },
    quantityUnitCode: { type: String, required: true, trim: true },
    packageUnitCode: { type: String, default: "", trim: true },
    active: { type: Boolean, default: true, index: true },
    connectorProvider: { type: String, default: "", trim: true },
    connectorMetadata: { type: Schema.Types.Mixed, default: {} },
    verifiedAt: { type: Date, default: null },
    verifiedById: { type: Schema.Types.ObjectId, default: null },
    createdByUserId: { type: Schema.Types.ObjectId, required: true },
    updatedByUserId: { type: Schema.Types.ObjectId, required: true },
  },
  { collection: "etims_service_mappings", timestamps: true, optimisticConcurrency: true },
);

etimsServiceMappingSchema.index({ active: 1, serviceTitle: 1 });

export type EtimsServiceMappingDocument = InferSchemaType<typeof etimsServiceMappingSchema>;
export const EtimsServiceMappingModel =
  (mongoose.models.EtimsServiceMapping as Model<EtimsServiceMappingDocument> | undefined)
  ?? mongoose.model<EtimsServiceMappingDocument>("EtimsServiceMapping", etimsServiceMappingSchema);
