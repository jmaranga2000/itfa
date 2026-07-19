import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCurrentUser } from "@/features/auth/server";
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

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const deep = rgb(3 / 255, 54 / 255, 61 / 255);
  const soft = rgb(189 / 255, 217 / 255, 215 / 255);
  page.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: deep });
  page.drawText("IFTA CONSULTING", { x: 42, y: 795, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText("CONSULTANCY INVOICE", { x: 42, y: 768, size: 11, font: regular, color: soft });
  page.drawText(invoice.invoiceNumber, { x: 400, y: 790, size: 13, font: bold, color: rgb(1, 1, 1) });
  const rows = [
    ["Client", workflow.clientName],
    ["Engagement", workflow.reference],
    ["Service", workflow.serviceName],
    ["Issue date", new Date(invoice.issueDate).toLocaleDateString("en-KE")],
    ["Due date", new Date(invoice.dueDate).toLocaleDateString("en-KE")],
    ["Status", invoice.status.replaceAll("_", " ").toUpperCase()],
  ];
  let y = 690;
  for (const [label, value] of rows) {
    page.drawText(label, { x: 42, y, size: 10, font: bold, color: deep });
    page.drawText(String(value).slice(0, 72), { x: 160, y, size: 10, font: regular, color: rgb(0.12, 0.16, 0.18) });
    y -= 32;
  }
  page.drawRectangle({ x: 42, y: y - 35, width: 511, height: 70, color: soft });
  page.drawText("AMOUNT DUE", { x: 62, y: y + 5, size: 11, font: bold, color: deep });
  page.drawText(`${invoice.currency} ${invoice.amount.toLocaleString("en-KE")}`, { x: 340, y: y - 1, size: 20, font: bold, color: deep });
  if (invoice.notes) page.drawText(invoice.notes.slice(0, 90), { x: 42, y: y - 75, size: 10, font: regular, color: rgb(0.25, 0.3, 0.32) });
  page.drawText("Thank you for choosing IFTA Consulting.", { x: 42, y: 55, size: 10, font: regular, color: deep });
  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`, "Cache-Control": "private, no-store" } });
}
