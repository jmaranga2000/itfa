export const FISCAL_INVOICE_STATUSES = [
  "DRAFT",
  "PENDING_ADMIN_APPROVAL",
  "RETURNED_FOR_CORRECTION",
  "ADMIN_REJECTED",
  "ADMIN_APPROVED",
  "ETIMS_QUEUED",
  "ETIMS_SUBMITTING",
  "ETIMS_ACCEPTED",
  "ETIMS_REJECTED",
  "ETIMS_RETRY_REQUIRED",
  "ETIMS_RECONCILIATION_REQUIRED",
  "DELIVERY_QUEUED",
  "PARTIALLY_DELIVERED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type FiscalInvoiceStatus = (typeof FISCAL_INVOICE_STATUSES)[number];

export const ADJUSTMENT_NOTE_TYPES = ["CREDIT_NOTE", "DEBIT_NOTE"] as const;
export type AdjustmentNoteType = (typeof ADJUSTMENT_NOTE_TYPES)[number];

export const ADJUSTMENT_NOTE_STATUSES = [
  "DRAFT",
  "VALIDATION_FAILED",
  "ETIMS_QUEUED",
  "ETIMS_SUBMITTING",
  "ETIMS_ACCEPTED",
  "ETIMS_REJECTED",
  "ETIMS_RETRY_REQUIRED",
  "ETIMS_RECONCILIATION_REQUIRED",
  "DELIVERY_QUEUED",
  "PARTIALLY_DELIVERED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type AdjustmentNoteStatus = (typeof ADJUSTMENT_NOTE_STATUSES)[number];

export const ETIMS_OUTBOX_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "RETRY_REQUIRED",
  "RECONCILIATION_REQUIRED",
  "DEAD_LETTER",
] as const;
export type EtimsOutboxStatus = (typeof ETIMS_OUTBOX_STATUSES)[number];

export const ETIMS_FISCAL_STATUSES = [
  "NOT_SUBMITTED",
  "QUEUED",
  "SUBMITTING",
  "ACCEPTED",
  "REJECTED",
  "RECONCILIATION_REQUIRED",
] as const;

export const INVOICE_ADJUSTMENT_STATUSES = [
  "NONE",
  "RESERVED",
  "SUBMITTING",
  "ACCEPTED",
  "RECONCILIATION_REQUIRED",
] as const;

export const LEGACY_ETIMS_MIGRATION_STATUSES = [
  "NOT_REQUIRED",
  "REVIEW_REQUIRED",
  "MANUALLY_LINKED",
  "EXCLUDED",
  "COMPLETED",
] as const;

export type EtimsSubmissionKind = "SALE" | AdjustmentNoteType;

export type EtimsSubmissionResult =
  | {
      outcome: "ACCEPTED";
      requestId: string;
      traderInvoiceNumber: string;
      kraInvoiceNumber: string;
      receiptNumber?: string;
      receiptSignature?: string;
      controlUnitId?: string;
      internalData?: string;
      qrData?: string;
      responseCode?: string;
      responseMessage?: string;
      connectorResponse: Record<string, unknown>;
    }
  | {
      outcome: "REJECTED";
      requestId?: string;
      responseCode?: string;
      responseMessage: string;
      connectorResponse: Record<string, unknown>;
    }
  | {
      outcome: "RETRY_REQUIRED" | "RECONCILIATION_REQUIRED";
      requestId?: string;
      responseCode?: string;
      responseMessage: string;
    };

export type EtimsConnectionResult = {
  ok: boolean;
  message: string;
  checkedAt: Date;
};

export type EtimsReconciliationResult =
  | { outcome: "ACCEPTED"; result: Extract<EtimsSubmissionResult, { outcome: "ACCEPTED" }> }
  | { outcome: "REJECTED"; result: Extract<EtimsSubmissionResult, { outcome: "REJECTED" }> }
  | { outcome: "UNRESOLVED"; message: string };

export type EtimsSubmissionEnvelope = {
  aggregateId: string;
  kind: EtimsSubmissionKind;
  idempotencyKey: string;
  payloadHash: string;
  payloadVersion: number;
  snapshot: Record<string, unknown>;
};

export interface EtimsConnector {
  submitSale(transaction: EtimsSubmissionEnvelope): Promise<EtimsSubmissionResult>;
  submitCreditNote(transaction: EtimsSubmissionEnvelope): Promise<EtimsSubmissionResult>;
  submitDebitNote(transaction: EtimsSubmissionEnvelope): Promise<EtimsSubmissionResult>;
  reconcileTransaction(transaction: EtimsSubmissionEnvelope): Promise<EtimsReconciliationResult>;
  verifyConnection(): Promise<EtimsConnectionResult>;
}

export function isClientVisibleInvoiceStatus(status: string) {
  return ["ETIMS_ACCEPTED", "DELIVERY_QUEUED", "PARTIALLY_DELIVERED", "DELIVERED"].includes(status);
}

export function isClientVisibleNoteStatus(status: string) {
  return ["ETIMS_ACCEPTED", "DELIVERY_QUEUED", "PARTIALLY_DELIVERED", "DELIVERED"].includes(status);
}