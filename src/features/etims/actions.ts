"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/features/auth/server";
import {
  cancelAdjustmentNoteDraft,
  confirmAdjustmentNote,
  createAdjustmentNote,
} from "@/repositories/adjustment-note-repository";
import {
  getEtimsConfiguration,
  testEtimsConnection,
  updateEtimsConfiguration,
  upsertEtimsServiceMapping,
} from "@/repositories/etims-configuration-repository";
import {
  approveFiscalInvoice,
  migrateLegacyFiscalInvoices,
  rejectFiscalInvoice,
  returnFiscalInvoiceForCorrection,
  submitFiscalInvoiceForApproval,
  updateFiscalInvoiceDraft,
} from "@/repositories/fiscal-invoice-repository";
import {
  reconcileEtimsTransaction,
  retryEtimsTransaction,
  retryFinanceDelivery,
} from "@/repositories/etims-worker-repository";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const text = z.string().trim().min(1).max(500);

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function refreshFinance(invoiceId?: string) {
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/finance/etims");
  revalidatePath("/admin/finance/etims/configuration");
  revalidatePath("/admin/finance/etims/mappings");
  revalidatePath("/staff/invoices");
  revalidatePath("/client/invoices");
  if (invoiceId) revalidatePath(`/admin/invoices/${invoiceId}`);
}

export async function approveFiscalInvoiceAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = objectId.safeParse(String(formData.get("invoiceId") ?? ""));
  if (!parsed.success) redirect("/admin/invoices?error=invoice-not-found");
  const result = await approveFiscalInvoice(principal, parsed.data);
  refreshFinance(parsed.data);
  if (!result.ok) redirect(`/admin/invoices/${parsed.data}?error=${result.reason}`);
  redirect(`/admin/invoices/${parsed.data}?saved=queued`);
}

export async function saveAndSubmitFiscalInvoiceAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = z.object({
    invoiceId: objectId,
    dueDate: z.coerce.date(),
    paymentTerms: z.string().trim().max(300),
    internalNotes: z.string().trim().max(1000),
  }).safeParse({
    invoiceId: formData.get("invoiceId"),
    dueDate: formData.get("dueDate"),
    paymentTerms: formData.get("paymentTerms") ?? "",
    internalNotes: formData.get("internalNotes") ?? "",
  });
  if (!parsed.success) redirect("/staff/invoices?error=invalid");
  const lineIds = formData.getAll("lineId").map(String);
  const descriptions = formData.getAll("description").map(String);
  const quantities = formData.getAll("quantity").map(Number);
  const prices = formData.getAll("unitPrice").map(Number);
  const updated = await updateFiscalInvoiceDraft({
    actor: principal,
    ...parsed.data,
    lines: lineIds.map((lineId, index) => ({
      lineId,
      description: descriptions[index] ?? "",
      quantity: quantities[index] ?? 0,
      unitPrice: prices[index] ?? 0,
    })),
  });
  if (!updated) redirect(`/staff/invoices/${parsed.data.invoiceId}?error=update`);
  const submitted = await submitFiscalInvoiceForApproval(principal, parsed.data.invoiceId);
  refreshFinance(parsed.data.invoiceId);
  redirect(`/staff/invoices/${parsed.data.invoiceId}?${submitted ? "saved=submitted" : "error=submit"}`);
}
export async function returnFiscalInvoiceAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = z.object({ invoiceId: objectId, reason: text }).safeParse({
    invoiceId: String(formData.get("invoiceId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
  if (!parsed.success) redirect("/admin/invoices?error=invalid");
  const ok = await returnFiscalInvoiceForCorrection(principal, parsed.data.invoiceId, parsed.data.reason);
  refreshFinance(parsed.data.invoiceId);
  redirect(`/admin/invoices/${parsed.data.invoiceId}?${ok ? "saved=returned" : "error=conflict"}`);
}

export async function rejectFiscalInvoiceAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = z.object({ invoiceId: objectId, reason: text }).safeParse({
    invoiceId: String(formData.get("invoiceId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
  if (!parsed.success) redirect("/admin/invoices?error=invalid");
  const ok = await rejectFiscalInvoice(principal, parsed.data.invoiceId, parsed.data.reason);
  refreshFinance(parsed.data.invoiceId);
  redirect(`/admin/invoices/${parsed.data.invoiceId}?${ok ? "saved=rejected" : "error=conflict"}`);
}

export async function saveEtimsConfigurationAction(formData: FormData) {
  const principal = await requireUser();
  const current = await getEtimsConfiguration();
  const parsed = z.object({
    environment: z.enum(["SANDBOX", "PRODUCTION"]),
    integrationType: z.enum(["DIRECT_OSCU", "CERTIFIED_INTEGRATOR"]),
    providerName: z.string().trim().min(2).max(100),
    taxpayerPin: z.string().trim().min(4).max(40),
    branchId: z.string().trim().min(1).max(80),
    deviceId: z.string().trim().min(1).max(80),
    apiBaseUrl: z.string().trim().url().or(z.literal("")),
    defaultCurrency: z.string().trim().length(3),
    defaultPaymentType: z.string().trim().min(2).max(50),
    invoicePrefix: z.string().trim().min(1).max(10),
    creditNotePrefix: z.string().trim().min(1).max(10),
    debitNotePrefix: z.string().trim().min(1).max(10),
    maxAttempts: z.coerce.number().int().min(1).max(20),
    initialRetrySeconds: z.coerce.number().int().min(10).max(86_400),
    reconciliationPath: z.string().trim().min(1).max(200),
    salePath: z.string().trim().min(1).max(200),
    creditNotePath: z.string().trim().min(1).max(200),
    debitNotePath: z.string().trim().max(200),
  }).safeParse({
    environment: formData.get("environment"),
    integrationType: formData.get("integrationType"),
    providerName: formData.get("providerName"),
    taxpayerPin: formData.get("taxpayerPin"),
    branchId: formData.get("branchId"),
    deviceId: formData.get("deviceId"),
    apiBaseUrl: formData.get("apiBaseUrl"),
    defaultCurrency: formData.get("defaultCurrency"),
    defaultPaymentType: formData.get("defaultPaymentType"),
    invoicePrefix: formData.get("invoicePrefix"),
    creditNotePrefix: formData.get("creditNotePrefix"),
    debitNotePrefix: formData.get("debitNotePrefix"),
    maxAttempts: formData.get("maxAttempts"),
    initialRetrySeconds: formData.get("initialRetrySeconds"),
    reconciliationPath: formData.get("reconciliationPath"),
    salePath: formData.get("salePath"),
    creditNotePath: formData.get("creditNotePath"),
    debitNotePath: formData.get("debitNotePath"),
  });
  if (!parsed.success) redirect("/admin/finance/etims/configuration?error=invalid");
  await updateEtimsConfiguration(principal, {
    ...parsed.data,
    credentialReference: current.credentialReference,
    enabled: checked(formData, "enabled"),
    taxRegistered: checked(formData, "taxRegistered"),
    reconciliationEnabled: checked(formData, "reconciliationEnabled"),
    debitNoteProductionVerified: checked(formData, "debitNoteProductionVerified"),
  });
  refreshFinance();
  redirect("/admin/finance/etims/configuration?saved=1");
}

export async function migrateLegacyFiscalInvoicesAction() {
  const principal = await requireUser();
  const result = await migrateLegacyFiscalInvoices(principal);
  refreshFinance();
  redirect(`/admin/finance/etims/configuration?migrated=${result.created}&review=${result.reviewRequired}`);
}

export async function testEtimsConnectionAction() {
  const principal = await requireUser();
  const result = await testEtimsConnection(principal);
  refreshFinance();
  redirect(`/admin/finance/etims/configuration?test=${result.ok ? "passed" : "failed"}`);
}

export async function saveEtimsServiceMappingAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = z.object({
    serviceId: objectId,
    itemCode: z.string().trim().min(1).max(80),
    classificationCode: z.string().trim().min(1).max(80),
    taxTypeCode: z.string().trim().min(1).max(40),
    taxRate: z.coerce.number().min(0).max(100),
    quantityUnitCode: z.string().trim().min(1).max(40),
    packageUnitCode: z.string().trim().min(1).max(40),
  }).safeParse({
    serviceId: formData.get("serviceId"),
    itemCode: formData.get("itemCode"),
    classificationCode: formData.get("classificationCode"),
    taxTypeCode: formData.get("taxTypeCode"),
    taxRate: formData.get("taxRate"),
    quantityUnitCode: formData.get("quantityUnitCode"),
    packageUnitCode: formData.get("packageUnitCode"),
  });
  if (!parsed.success) redirect("/admin/finance/etims/mappings?error=invalid");
  const result = await upsertEtimsServiceMapping(principal, {
    ...parsed.data,
    active: checked(formData, "active"),
  });
  refreshFinance();
  redirect(`/admin/finance/etims/mappings?${result ? "saved=1" : "error=not-found"}`);
}

export async function createAdjustmentNoteAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = z.object({
    originalInvoiceId: objectId,
    type: z.enum(["CREDIT_NOTE", "DEBIT_NOTE"]),
    reasonCode: z.string().trim().min(1).max(40),
    reasonDescription: z.string().trim().min(3).max(500),
    internalExplanation: z.string().trim().min(3).max(1000),
  }).safeParse({
    originalInvoiceId: formData.get("originalInvoiceId"),
    type: formData.get("type"),
    reasonCode: formData.get("reasonCode"),
    reasonDescription: formData.get("reasonDescription"),
    internalExplanation: formData.get("internalExplanation"),
  });
  if (!parsed.success) redirect("/admin/invoices?error=invalid-adjustment");
  const lineIds = formData.getAll("lineId").map(String);
  const quantities = formData.getAll("quantity").map(Number);
  const prices = formData.getAll("unitPrice").map(Number);
  const result = await createAdjustmentNote({
    actor: principal,
    ...parsed.data,
    lines: lineIds.map((originalInvoiceLineId, index) => ({
      originalInvoiceLineId,
      adjustmentQuantity: quantities[index] ?? 0,
      adjustmentUnitPrice: prices[index] ?? 0,
    })),
  });
  refreshFinance(parsed.data.originalInvoiceId);
  if (!result.ok) redirect(`/admin/invoices/${parsed.data.originalInvoiceId}?error=${result.reason}`);
  redirect(`/admin/finance/etims/adjustments/${result.noteId}?saved=draft`);
}

export async function confirmAdjustmentNoteAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = z.object({
    noteId: objectId,
    password: z.string().min(1).max(200),
    confirmationPhrase: z.string().trim().min(1).max(40),
  }).safeParse({
    noteId: formData.get("noteId"),
    password: formData.get("password"),
    confirmationPhrase: formData.get("confirmationPhrase"),
  });
  if (!parsed.success) redirect("/admin/finance/etims?error=invalid-confirmation");
  const result = await confirmAdjustmentNote({ actor: principal, ...parsed.data });
  refreshFinance();
  if (!result.ok) redirect(`/admin/finance/etims/adjustments/${parsed.data.noteId}?error=${result.reason}`);
  redirect(`/admin/finance/etims/adjustments/${parsed.data.noteId}?saved=queued`);
}

export async function cancelAdjustmentNoteAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = z.object({ noteId: objectId, reason: text }).safeParse({
    noteId: formData.get("noteId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) redirect("/admin/finance/etims?error=invalid");
  const ok = await cancelAdjustmentNoteDraft(principal, parsed.data.noteId, parsed.data.reason);
  refreshFinance();
  redirect(`/admin/finance/etims/adjustments/${parsed.data.noteId}?${ok ? "saved=cancelled" : "error=conflict"}`);
}

export async function retryEtimsTransactionAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = z.object({ eventId: objectId, reason: text }).safeParse({
    eventId: formData.get("eventId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) redirect("/admin/finance/etims?error=invalid");
  const ok = await retryEtimsTransaction(principal, parsed.data.eventId, parsed.data.reason);
  refreshFinance();
  redirect(`/admin/finance/etims?${ok ? "saved=retry" : "error=conflict"}`);
}

export async function reconcileEtimsTransactionAction(formData: FormData) {
  const principal = await requireUser();
  const eventId = String(formData.get("eventId") ?? "");
  if (!objectId.safeParse(eventId).success) redirect("/admin/finance/etims?error=invalid");
  const result = await reconcileEtimsTransaction(principal, eventId);
  refreshFinance();
  redirect(`/admin/finance/etims?${result.ok ? `saved=${result.outcome}` : `error=${result.outcome}`}`);
}

export async function retryFinanceDeliveryAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = z.object({ jobId: objectId, reason: text }).safeParse({
    jobId: formData.get("jobId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) redirect("/admin/finance/etims?error=invalid");
  const ok = await retryFinanceDelivery(principal, parsed.data.jobId, parsed.data.reason);
  refreshFinance();
  redirect(`/admin/finance/etims?${ok ? "saved=delivery-retry" : "error=conflict"}`);
}


