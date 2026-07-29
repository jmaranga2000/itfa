import { getServerEnv } from "@/lib/env";
import type {
  EtimsConnectionResult,
  EtimsConnector,
  EtimsReconciliationResult,
  EtimsSubmissionEnvelope,
  EtimsSubmissionResult,
} from "@/features/etims/types";

export type EtimsConnectorConfiguration = {
  environment: "SANDBOX" | "PRODUCTION";
  providerName: string;
  apiBaseUrl: string;
  salePath: string;
  creditNotePath: string;
  debitNotePath: string;
  reconciliationPath: string;
  taxpayerPin: string;
  branchId: string;
  deviceId: string;
};

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function textValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

const SECRET_KEY_PATTERN = /token|secret|password|authorization|credential|private.?key/i;

export function sanitiseConnectorResponse(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitiseConnectorResponse);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SECRET_KEY_PATTERN.test(key))
      .map(([key, child]) => [key, sanitiseConnectorResponse(child)]),
  );
}

async function responseBody(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return recordValue(JSON.parse(text));
  } catch {
    return { message: text.slice(0, 500) };
  }
}

function acceptedResult(
  body: Record<string, unknown>,
  envelope: EtimsSubmissionEnvelope,
): Extract<EtimsSubmissionResult, { outcome: "ACCEPTED" }> | null {
  const nested = recordValue(body.data);
  const source = Object.keys(nested).length ? { ...body, ...nested } : body;
  const status = textValue(source, ["status", "result", "outcome", "transactionStatus"]).toUpperCase();
  const responseCode = textValue(source, ["responseCode", "resultCode", "code"]);
  const kraInvoiceNumber = textValue(source, [
    "kraInvoiceNumber",
    "fiscalInvoiceNumber",
    "invoiceNumber",
    "sdcId",
  ]);
  const accepted = ["ACCEPTED", "SUCCESS", "SUCCEEDED", "COMPLETED", "OK"].includes(status)
    || ["0", "00", "000"].includes(responseCode);
  if (!accepted || !kraInvoiceNumber) return null;

  return {
    outcome: "ACCEPTED",
    requestId: textValue(source, ["requestId", "transactionId", "reference"]) || envelope.idempotencyKey,
    traderInvoiceNumber: textValue(source, ["traderInvoiceNumber", "traderInvoiceNo"])
      || textValue(envelope.snapshot, ["traderInvoiceNumber", "invoiceNumber"]),
    kraInvoiceNumber,
    receiptNumber: textValue(source, ["receiptNumber", "receiptNo"]),
    receiptSignature: textValue(source, ["receiptSignature", "signature"]),
    controlUnitId: textValue(source, ["controlUnitId", "deviceId", "sdcId"]),
    internalData: textValue(source, ["internalData"]),
    qrData: textValue(source, ["qrData", "qrCode", "verificationUrl"]),
    responseCode,
    responseMessage: textValue(source, ["responseMessage", "message", "description"]),
    connectorResponse: sanitiseConnectorResponse(body) as Record<string, unknown>,
  };
}

function rejectedResult(
  body: Record<string, unknown>,
): Extract<EtimsSubmissionResult, { outcome: "REJECTED" }> {
  const nested = recordValue(body.data);
  const source = Object.keys(nested).length ? { ...body, ...nested } : body;
  return {
    outcome: "REJECTED",
    requestId: textValue(source, ["requestId", "transactionId", "reference"]),
    responseCode: textValue(source, ["responseCode", "resultCode", "code"]),
    responseMessage: textValue(source, ["responseMessage", "message", "description"])
      || "KRA eTIMS rejected the transaction.",
    connectorResponse: sanitiseConnectorResponse(body) as Record<string, unknown>,
  };
}

class OscuHttpConnector implements EtimsConnector {
  constructor(private readonly configuration: EtimsConnectorConfiguration) {}

  private headers() {
    const token = getServerEnv().KRA_ETIMS_API_TOKEN?.trim();
    if (!token) throw new Error("KRA eTIMS credentials are not configured.");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": "",
    };
  }

  private async submit(
    path: string,
    envelope: EtimsSubmissionEnvelope,
  ): Promise<EtimsSubmissionResult> {
    const headers = this.headers();
    headers["X-Idempotency-Key"] = envelope.idempotencyKey;
    try {
      const response = await fetch(joinUrl(this.configuration.apiBaseUrl, path), {
        method: "POST",
        headers,
        body: JSON.stringify({
          transactionType: envelope.kind,
          taxpayerPin: this.configuration.taxpayerPin,
          branchId: this.configuration.branchId,
          deviceId: this.configuration.deviceId,
          idempotencyKey: envelope.idempotencyKey,
          payloadHash: envelope.payloadHash,
          payloadVersion: envelope.payloadVersion,
          transaction: envelope.snapshot,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      const body = await responseBody(response);
      if (response.ok) {
        return acceptedResult(body, envelope) ?? {
          outcome: "RECONCILIATION_REQUIRED",
          requestId: textValue(body, ["requestId", "transactionId", "reference"]),
          responseCode: textValue(body, ["responseCode", "code"]),
          responseMessage: "The connector responded, but acceptance could not be confirmed.",
        };
      }
      if ([408, 504].includes(response.status)) {
        return {
          outcome: "RECONCILIATION_REQUIRED",
          requestId: textValue(body, ["requestId", "transactionId", "reference"]),
          responseCode: String(response.status),
          responseMessage: "The submission result is uncertain and must be reconciled.",
        };
      }
      if (response.status === 429 || response.status >= 500) {
        return {
          outcome: "RETRY_REQUIRED",
          responseCode: String(response.status),
          responseMessage: textValue(body, ["message", "responseMessage"])
            || "The eTIMS connector is temporarily unavailable.",
        };
      }
      return rejectedResult({ ...body, code: textValue(body, ["code"]) || String(response.status) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connector request failed.";
      if (/timeout|aborted/i.test(message)) {
        return {
          outcome: "RECONCILIATION_REQUIRED",
          responseMessage: "The connector timed out after submission; reconciliation is required.",
        };
      }
      return { outcome: "RETRY_REQUIRED", responseMessage: message.slice(0, 300) };
    }
  }

  submitSale(transaction: EtimsSubmissionEnvelope) {
    return this.submit(this.configuration.salePath, transaction);
  }

  submitCreditNote(transaction: EtimsSubmissionEnvelope) {
    return this.submit(this.configuration.creditNotePath, transaction);
  }

  submitDebitNote(transaction: EtimsSubmissionEnvelope) {
    return this.submit(this.configuration.debitNotePath, transaction);
  }

  async reconcileTransaction(
    transaction: EtimsSubmissionEnvelope,
  ): Promise<EtimsReconciliationResult> {
    try {
      const response = await fetch(
        joinUrl(this.configuration.apiBaseUrl, this.configuration.reconciliationPath),
        {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({
            aggregateId: transaction.aggregateId,
            idempotencyKey: transaction.idempotencyKey,
            payloadHash: transaction.payloadHash,
            traderInvoiceNumber: textValue(transaction.snapshot, [
              "traderInvoiceNumber",
              "invoiceNumber",
              "noteNumber",
            ]),
          }),
          signal: AbortSignal.timeout(20_000),
        },
      );
      const body = await responseBody(response);
      if (!response.ok) {
        return { outcome: "UNRESOLVED", message: "The connector could not confirm the transaction." };
      }
      const accepted = acceptedResult(body, transaction);
      if (accepted) return { outcome: "ACCEPTED", result: accepted };
      const status = textValue(body, ["status", "outcome"]).toUpperCase();
      if (["REJECTED", "FAILED", "DECLINED"].includes(status)) {
        return { outcome: "REJECTED", result: rejectedResult(body) };
      }
      return { outcome: "UNRESOLVED", message: "The connector returned no conclusive fiscal result." };
    } catch {
      return { outcome: "UNRESOLVED", message: "Reconciliation could not reach the connector." };
    }
  }

  async verifyConnection(): Promise<EtimsConnectionResult> {
    try {
      const response = await fetch(this.configuration.apiBaseUrl, {
        method: "GET",
        headers: this.headers(),
        signal: AbortSignal.timeout(15_000),
      });
      return {
        ok: response.ok || response.status === 404 || response.status === 405,
        message: response.ok
          ? "The eTIMS connector responded successfully."
          : `The connector responded with status ${response.status}.`,
        checkedAt: new Date(),
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "The connector could not be reached.",
        checkedAt: new Date(),
      };
    }
  }
}

export function createEtimsConnector(configuration: EtimsConnectorConfiguration): EtimsConnector {
  return new OscuHttpConnector(configuration);
}
