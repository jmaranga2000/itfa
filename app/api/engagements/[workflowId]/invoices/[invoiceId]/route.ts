import { getCurrentUser } from "@/features/auth/server";
import { createInvoicePdf } from "@/features/invoices/invoice-pdf";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workflowId: string; invoiceId: string }> },
) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  const { workflowId, invoiceId } = await params;
  const workflow = await getWorkflowForPrincipal(principal, workflowId);
  const invoice = workflow?.financial.invoices.find((item) => item.invoiceId === invoiceId);
  if (!workflow || !invoice) return new Response("Not found", { status: 404 });

  const bytes = await createInvoicePdf({
    clientName: workflow.clientName,
    engagementReference: workflow.reference,
    serviceName: workflow.serviceName,
    invoice,
  });
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
