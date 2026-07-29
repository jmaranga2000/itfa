import { getCurrentUser } from "@/features/auth/server";
import {
  getFiscalInvoice,
  getFiscalInvoiceIdByEmbeddedInvoiceId,
} from "@/repositories/fiscal-invoice-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workflowId: string; invoiceId: string }> },
) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  const { workflowId, invoiceId } = await params;
  const fiscalId = await getFiscalInvoiceIdByEmbeddedInvoiceId(invoiceId);
  if (!fiscalId) return new Response("Fiscal invoice not found.", { status: 404 });
  const invoice = await getFiscalInvoice(principal, fiscalId);
  if (!invoice
    || invoice.workflowId !== workflowId
    || invoice.etims.status !== "ACCEPTED"
    || !invoice.finalPdfAvailable) {
    return new Response("Fiscal invoice is not available.", { status: 404 });
  }
  return Response.redirect(new URL(`/api/finance/invoices/${invoice.id}/pdf`, request.url), 307);
}