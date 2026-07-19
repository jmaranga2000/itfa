import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Types } from "mongoose";
import { getCurrentUser } from "@/features/auth/server";
import { ClientPaymentModel } from "@/models/client-payment";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workflowId: string; paymentId: string }> },
) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  const { workflowId, paymentId } = await params;
  if (!Types.ObjectId.isValid(paymentId)) return new Response("Not found", { status: 404 });
  const [workflow, payment] = await Promise.all([
    getWorkflowForPrincipal(principal, workflowId),
    ClientPaymentModel.findOne({ _id: paymentId, workflowId, status: "verified" }).lean().exec(),
  ]);
  if (!workflow || !payment) return new Response("Not found", { status: 404 });
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 520]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const deep = rgb(3 / 255, 54 / 255, 61 / 255);
  const soft = rgb(189 / 255, 217 / 255, 215 / 255);
  page.drawRectangle({ x: 0, y: 420, width: 595, height: 100, color: deep });
  page.drawText("IFTA CONSULTING", { x: 42, y: 472, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText("PAYMENT RECEIPT", { x: 42, y: 445, size: 11, font: regular, color: soft });
  page.drawText(payment.receiptNumber ?? payment.transactionReference, { x: 360, y: 468, size: 12, font: bold, color: rgb(1, 1, 1) });
  const rows = [
    ["Received from", workflow.clientName],
    ["Engagement", workflow.reference],
    ["Payment date", new Date(payment.verifiedAt ?? payment.submittedAt).toLocaleDateString("en-KE")],
    ["Payment method", payment.method.replaceAll("_", " ")],
    ["Reference", payment.transactionReference],
  ];
  let y = 370;
  for (const [label, value] of rows) {
    page.drawText(label, { x: 42, y, size: 10, font: bold, color: deep });
    page.drawText(String(value), { x: 160, y, size: 10, font: regular });
    y -= 34;
  }
  page.drawRectangle({ x: 42, y: 125, width: 511, height: 70, color: soft });
  page.drawText("AMOUNT RECEIVED", { x: 62, y: 154, size: 11, font: bold, color: deep });
  page.drawText(`${payment.currency} ${payment.amount.toLocaleString("en-KE")}`, { x: 330, y: 148, size: 20, font: bold, color: deep });
  page.drawText("This receipt confirms payment verification by IFTA Consulting.", { x: 42, y: 55, size: 10, font: regular, color: deep });
  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${payment.receiptNumber ?? "payment-receipt"}.pdf"`, "Cache-Control": "private, no-store" } });
}
