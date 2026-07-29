import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { hasPermission } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { createEtimsConnector, type EtimsConnectorConfiguration } from "@/features/etims/connector";
import { getServerEnv } from "@/lib/env";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthorizationError } from "@/lib/errors";
import { EtimsConfigurationModel } from "@/models/etims-configuration";
import { EtimsServiceMappingModel } from "@/models/etims-service-mapping";
import { ServiceCatalogModel } from "@/models/service-catalog";

export type EtimsConfigurationRecord = {
  enabled: boolean;
  environment: "SANDBOX" | "PRODUCTION";
  integrationType: "DIRECT_OSCU" | "CERTIFIED_INTEGRATOR";
  providerName: string;
  taxpayerPin: string;
  branchId: string;
  deviceId: string;
  apiBaseUrl: string;
  credentialReference: string;
  credentialConfigured: boolean;
  defaultCurrency: string;
  defaultPaymentType: string;
  taxRegistered: boolean;
  invoicePrefix: string;
  creditNotePrefix: string;
  debitNotePrefix: string;
  maxAttempts: number;
  initialRetrySeconds: number;
  reconciliationEnabled: boolean;
  reconciliationPath: string;
  salePath: string;
  creditNotePath: string;
  debitNotePath: string;
  debitNoteProductionVerified: boolean;
  lastConnectionTestAt: string | null;
  lastConnectionTestSucceeded: boolean;
  lastSuccessfulTransactionAt: string | null;
  lastFailedTransactionAt: string | null;
  referenceDataSyncedAt: string | null;
  referenceDataStatus: string;
  version: number;
  configuredByName: string;
  configuredAt: string | null;
  readiness: { ready: boolean; missing: string[] };
};

export type EtimsServiceMappingRecord = {
  id: string | null;
  serviceId: string;
  serviceTitle: string;
  serviceStatus: string;
  itemCode: string;
  classificationCode: string;
  taxTypeCode: string;
  taxRate: number;
  quantityUnitCode: string;
  packageUnitCode: string;
  active: boolean;
  connectorProvider: string;
  verifiedAt: string | null;
  mapped: boolean;
};

type RawConfiguration = {
  enabled?: boolean;
  environment?: EtimsConfigurationRecord["environment"];
  integrationType?: EtimsConfigurationRecord["integrationType"];
  providerName?: string;
  taxpayerPin?: string;
  branchId?: string;
  deviceId?: string;
  apiBaseUrl?: string;
  credentialReference?: string;
  defaultCurrency?: string;
  defaultPaymentType?: string;
  taxRegistered?: boolean;
  invoicePrefix?: string;
  creditNotePrefix?: string;
  debitNotePrefix?: string;
  maxAttempts?: number;
  initialRetrySeconds?: number;
  reconciliationEnabled?: boolean;
  reconciliationPath?: string;
  salePath?: string;
  creditNotePath?: string;
  debitNotePath?: string;
  debitNoteProductionVerified?: boolean;
  lastConnectionTestAt?: Date | null;
  lastConnectionTestSucceeded?: boolean;
  lastSuccessfulTransactionAt?: Date | null;
  lastFailedTransactionAt?: Date | null;
  referenceDataSyncedAt?: Date | null;
  referenceDataStatus?: string;
  version?: number;
  configuredByName?: string;
  configuredAt?: Date | null;
};

const DEFAULT_CONFIGURATION: Required<Pick<
  EtimsConfigurationRecord,
  | "environment"
  | "integrationType"
  | "providerName"
  | "credentialReference"
  | "defaultCurrency"
  | "defaultPaymentType"
  | "taxRegistered"
  | "invoicePrefix"
  | "creditNotePrefix"
  | "debitNotePrefix"
  | "maxAttempts"
  | "initialRetrySeconds"
  | "reconciliationEnabled"
  | "reconciliationPath"
  | "salePath"
  | "creditNotePath"
  | "referenceDataStatus"
>> = {
  environment: "SANDBOX",
  integrationType: "DIRECT_OSCU",
  providerName: "KRA OSCU",
  credentialReference: "KRA_ETIMS_API_TOKEN",
  defaultCurrency: "KES",
  defaultPaymentType: "BANK_TRANSFER",
  taxRegistered: true,
  invoicePrefix: "INV",
  creditNotePrefix: "CN",
  debitNotePrefix: "DN",
  maxAttempts: 5,
  initialRetrySeconds: 60,
  reconciliationEnabled: true,
  reconciliationPath: "/transactions/reconcile",
  salePath: "/sales",
  creditNotePath: "/credit-notes",
  referenceDataStatus: "NOT_SYNCED",
};

function missingConfiguration(record: RawConfiguration) {
  const missing: string[] = [];
  if (!record.enabled) missing.push("Integration is disabled");
  if (!record.taxpayerPin?.trim()) missing.push("Taxpayer PIN");
  if (!record.branchId?.trim()) missing.push("Branch identifier");
  if (!record.deviceId?.trim()) missing.push("Device or control-unit identifier");
  if (!(record.apiBaseUrl?.trim() || getServerEnv().KRA_ETIMS_API_URL?.trim())) missing.push("API base URL");
  if (!getServerEnv().KRA_ETIMS_API_TOKEN?.trim()) missing.push("Connector credential");
  return missing;
}

function serializeConfiguration(raw: RawConfiguration): EtimsConfigurationRecord {
  const missing = missingConfiguration(raw);
  return {
    enabled: raw.enabled ?? false,
    environment: raw.environment ?? DEFAULT_CONFIGURATION.environment,
    integrationType: raw.integrationType ?? DEFAULT_CONFIGURATION.integrationType,
    providerName: raw.providerName ?? DEFAULT_CONFIGURATION.providerName,
    taxpayerPin: raw.taxpayerPin ?? "",
    branchId: raw.branchId ?? "",
    deviceId: raw.deviceId ?? "",
    apiBaseUrl: raw.apiBaseUrl ?? "",
    credentialReference: raw.credentialReference ?? DEFAULT_CONFIGURATION.credentialReference,
    credentialConfigured: Boolean(getServerEnv().KRA_ETIMS_API_TOKEN?.trim()),
    defaultCurrency: raw.defaultCurrency ?? DEFAULT_CONFIGURATION.defaultCurrency,
    defaultPaymentType: raw.defaultPaymentType ?? DEFAULT_CONFIGURATION.defaultPaymentType,
    taxRegistered: raw.taxRegistered ?? DEFAULT_CONFIGURATION.taxRegistered,
    invoicePrefix: raw.invoicePrefix ?? DEFAULT_CONFIGURATION.invoicePrefix,
    creditNotePrefix: raw.creditNotePrefix ?? DEFAULT_CONFIGURATION.creditNotePrefix,
    debitNotePrefix: raw.debitNotePrefix ?? DEFAULT_CONFIGURATION.debitNotePrefix,
    maxAttempts: raw.maxAttempts ?? DEFAULT_CONFIGURATION.maxAttempts,
    initialRetrySeconds: raw.initialRetrySeconds ?? DEFAULT_CONFIGURATION.initialRetrySeconds,
    reconciliationEnabled: raw.reconciliationEnabled ?? DEFAULT_CONFIGURATION.reconciliationEnabled,
    reconciliationPath: raw.reconciliationPath ?? DEFAULT_CONFIGURATION.reconciliationPath,
    salePath: raw.salePath ?? DEFAULT_CONFIGURATION.salePath,
    creditNotePath: raw.creditNotePath ?? DEFAULT_CONFIGURATION.creditNotePath,
    debitNotePath: raw.debitNotePath ?? "",
    debitNoteProductionVerified: raw.debitNoteProductionVerified ?? false,
    lastConnectionTestAt: raw.lastConnectionTestAt?.toISOString() ?? null,
    lastConnectionTestSucceeded: raw.lastConnectionTestSucceeded ?? false,
    lastSuccessfulTransactionAt: raw.lastSuccessfulTransactionAt?.toISOString() ?? null,
    lastFailedTransactionAt: raw.lastFailedTransactionAt?.toISOString() ?? null,
    referenceDataSyncedAt: raw.referenceDataSyncedAt?.toISOString() ?? null,
    referenceDataStatus: raw.referenceDataStatus ?? DEFAULT_CONFIGURATION.referenceDataStatus,
    version: raw.version ?? 1,
    configuredByName: raw.configuredByName ?? "",
    configuredAt: raw.configuredAt?.toISOString() ?? null,
    readiness: { ready: missing.length === 0, missing },
  };
}

async function ensureConfiguration() {
  return EtimsConfigurationModel.findOneAndUpdate(
    { singletonKey: "primary" },
    { $setOnInsert: { singletonKey: "primary" } },
    { upsert: true, returnDocument: "after" },
  ).lean().exec();
}

export async function getEtimsConfiguration() {
  await connectToDatabase();
  return serializeConfiguration((await ensureConfiguration()) as unknown as RawConfiguration);
}

export async function getOperationalEtimsConfiguration(): Promise<EtimsConnectorConfiguration & {
  maxAttempts: number;
  initialRetrySeconds: number;
  debitNoteProductionVerified: boolean;
}> {
  const record = await getEtimsConfiguration();
  if (!record.readiness.ready) {
    throw new Error(`eTIMS configuration is incomplete: ${record.readiness.missing.join(", ")}.`);
  }
  return {
    environment: record.environment,
    providerName: record.providerName,
    apiBaseUrl: record.apiBaseUrl || getServerEnv().KRA_ETIMS_API_URL || "",
    salePath: record.salePath,
    creditNotePath: record.creditNotePath,
    debitNotePath: record.debitNotePath,
    reconciliationPath: record.reconciliationPath,
    taxpayerPin: record.taxpayerPin,
    branchId: record.branchId,
    deviceId: record.deviceId,
    maxAttempts: record.maxAttempts,
    initialRetrySeconds: record.initialRetrySeconds,
    debitNoteProductionVerified: record.debitNoteProductionVerified,
  };
}

export async function updateEtimsConfiguration(
  actor: Principal,
  input: Omit<
    EtimsConfigurationRecord,
    | "credentialConfigured"
    | "lastConnectionTestAt"
    | "lastConnectionTestSucceeded"
    | "lastSuccessfulTransactionAt"
    | "lastFailedTransactionAt"
    | "referenceDataSyncedAt"
    | "referenceDataStatus"
    | "version"
    | "configuredByName"
    | "configuredAt"
    | "readiness"
  >,
) {
  if (!hasPermission(actor, "etims.config.update")) throw new AuthorizationError();
  await connectToDatabase();
  const previous = await getEtimsConfiguration();
  if (
    input.enabled
    && input.environment === "PRODUCTION"
    && !input.debitNoteProductionVerified
    && input.debitNotePath.trim()
  ) {
    throw new Error("Production debit-note mapping must be verified before activation.");
  }
  const now = new Date();
  await EtimsConfigurationModel.updateOne(
    { singletonKey: "primary" },
    {
      $set: {
        ...input,
        configuredByUserId: Types.ObjectId.isValid(actor.id) ? new Types.ObjectId(actor.id) : null,
        configuredByName: actor.displayName || actor.email,
        configuredAt: now,
        ...(input.enabled && input.environment === "PRODUCTION" ? { productionActivatedAt: now } : {}),
      },
      $inc: { version: 1 },
      $setOnInsert: { singletonKey: "primary" },
    },
    { upsert: true },
  ).exec();
  await writeAuditLog({
    actor,
    action: "etims.configuration_changed",
    resourceType: "EtimsConfiguration",
    resourceId: "primary",
    previousValues: {
      enabled: previous.enabled,
      environment: previous.environment,
      providerName: previous.providerName,
      taxpayerPin: previous.taxpayerPin,
      branchId: previous.branchId,
      deviceId: previous.deviceId,
    },
    newValues: {
      enabled: input.enabled,
      environment: input.environment,
      providerName: input.providerName,
      taxpayerPin: input.taxpayerPin,
      branchId: input.branchId,
      deviceId: input.deviceId,
    },
  });
  return getEtimsConfiguration();
}

export async function testEtimsConnection(actor: Principal) {
  if (!hasPermission(actor, "etims.config.test")) throw new AuthorizationError();
  const configuration = await getOperationalEtimsConfiguration();
  const result = await createEtimsConnector(configuration).verifyConnection();
  await EtimsConfigurationModel.updateOne(
    { singletonKey: "primary" },
    {
      $set: {
        lastConnectionTestAt: result.checkedAt,
        lastConnectionTestSucceeded: result.ok,
      },
    },
  ).exec();
  await writeAuditLog({
    actor,
    action: "etims.connection_tested",
    resourceType: "EtimsConfiguration",
    resourceId: "primary",
    newValues: { success: result.ok, checkedAt: result.checkedAt },
  });
  return result;
}

export async function listEtimsServiceMappings(): Promise<EtimsServiceMappingRecord[]> {
  await connectToDatabase();
  const [services, mappings] = await Promise.all([
    ServiceCatalogModel.find({ archivedAt: null }).sort({ title: 1 }).lean().exec(),
    EtimsServiceMappingModel.find({}).lean().exec(),
  ]);
  const mappingByService = new Map(mappings.map((mapping) => [mapping.serviceId.toString(), mapping]));
  return services.map((service) => {
    const mapping = mappingByService.get(service._id.toString());
    return {
      id: mapping?._id.toString() ?? null,
      serviceId: service._id.toString(),
      serviceTitle: service.title,
      serviceStatus: service.status,
      itemCode: mapping?.itemCode ?? "",
      classificationCode: mapping?.classificationCode ?? "",
      taxTypeCode: mapping?.taxTypeCode ?? "",
      taxRate: mapping?.taxRate ?? 0,
      quantityUnitCode: mapping?.quantityUnitCode ?? "",
      packageUnitCode: mapping?.packageUnitCode ?? "",
      active: mapping?.active ?? false,
      connectorProvider: mapping?.connectorProvider ?? "",
      verifiedAt: mapping?.verifiedAt?.toISOString() ?? null,
      mapped: Boolean(mapping),
    };
  });
}

export async function upsertEtimsServiceMapping(
  actor: Principal,
  input: {
    serviceId: string;
    itemCode: string;
    classificationCode: string;
    taxTypeCode: string;
    taxRate: number;
    quantityUnitCode: string;
    packageUnitCode: string;
    active: boolean;
  },
) {
  if (!hasPermission(actor, "etims.mapping.update")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(actor.id) || !Types.ObjectId.isValid(input.serviceId)) return null;
  await connectToDatabase();
  const service = await ServiceCatalogModel.findOne({ _id: input.serviceId, archivedAt: null }).lean().exec();
  if (!service) return null;
  const actorId = new Types.ObjectId(actor.id);
  const mapping = await EtimsServiceMappingModel.findOneAndUpdate(
    { serviceId: service._id },
    {
      $set: {
        serviceTitle: service.title,
        itemType: "SERVICE",
        itemCode: input.itemCode,
        classificationCode: input.classificationCode,
        taxTypeCode: input.taxTypeCode,
        taxRate: input.taxRate,
        quantityUnitCode: input.quantityUnitCode,
        packageUnitCode: input.packageUnitCode,
        active: input.active,
        connectorProvider: (await getEtimsConfiguration()).providerName,
        verifiedAt: new Date(),
        verifiedById: actorId,
        updatedByUserId: actorId,
      },
      $setOnInsert: { createdByUserId: actorId },
    },
    { upsert: true, returnDocument: "after", runValidators: true },
  ).lean().exec();
  await writeAuditLog({
    actor,
    action: "etims.service_mapping_changed",
    resourceType: "EtimsServiceMapping",
    resourceId: mapping?._id.toString() ?? input.serviceId,
    newValues: { ...input, serviceTitle: service.title },
  });
  return mapping?._id.toString() ?? null;
}

export async function getActiveServiceMapping(serviceId: string | null) {
  if (!serviceId || !Types.ObjectId.isValid(serviceId)) return null;
  await connectToDatabase();
  return EtimsServiceMappingModel.findOne({ serviceId, active: true }).lean().exec();
}
