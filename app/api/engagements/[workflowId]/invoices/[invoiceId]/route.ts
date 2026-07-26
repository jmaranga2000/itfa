import { getCurrentUser } from "@/features/auth/server";
import { createInvoicePdf, type InvoiceCompanyDetails } from "@/features/invoices/invoice-pdf";
import { getPlatformSettings } from "@/repositories/platform-settings-repository";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workflowId: string; invoiceId: string }> },
) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  const { workflowId, invoiceId } = await params;
  const [workflow, settings] = await Promise.all([
    getWorkflowForPrincipal(principal, workflowId),
    getPlatformSettings(),
  ]);
  const invoice = workflow?.financial.invoices.find((item) => item.invoiceId === invoiceId);
  if (!workflow || !invoice) return new Response("Not found", { status: 404 });

  const saved = invoice.approvalStampDetails;
  const currentAddress = [settings.company.address, settings.company.city, settings.company.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
  const company: InvoiceCompanyDetails = {
    companyName: saved.companyName || settings.company.tradingName || settings.company.legalName || "IFTA Consulting",
    legalName: saved.legalName || settings.company.legalName || settings.company.tradingName || "IFTA Consulting",
    registrationNumber: saved.registrationNumber || settings.company.registrationNumber,
    kraPin: saved.kraPin || settings.company.kraPin,
    address: saved.address || currentAddress,
    email: saved.email || settings.company.email,
    phone: saved.phone || settings.company.phone,
    website: saved.website || settings.company.website,
    approverTitle: saved.approverTitle || settings.engagement.signatoryTitle || "Authorized Signatory",
    timezone: settings.portal.timezone || "Africa/Nairobi",
  };
  const bytes = await createInvoicePdf({
    clientName: workflow.clientName,
    engagementReference: workflow.reference,
    serviceName: workflow.serviceName,
    company,
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