import { redirect } from "next/navigation";
import { AdjustmentNoteForm } from "@/components/dashboard/finance/adjustment-note-form";
import { hasPermission } from "@/features/authorization/access-control";
import { requireUser } from "@/features/auth/server";
import { getFiscalInvoice } from "@/repositories/fiscal-invoice-repository";

export default async function NewAdjustmentNotePage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const [principal, { invoiceId }] = await Promise.all([requireUser(), params]);
  if (!hasPermission(principal, "adjustment_note.create")) redirect("/access-blocked");
  const invoice = await getFiscalInvoice(principal, invoiceId);
  if (!invoice
    || invoice.etims.status !== "ACCEPTED"
    || invoice.adjustmentStatus !== "NONE") redirect("/access-blocked");
  return <AdjustmentNoteForm invoice={invoice} />;
}
