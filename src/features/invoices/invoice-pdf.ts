import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type InvoicePdfInput = {
  clientName: string;
  engagementReference: string;
  serviceName: string;
  invoice: {
    invoiceNumber: string;
    issueDate: string | Date;
    dueDate: string | Date;
    amount: number;
    currency: string;
    status: string;
    notes?: string;
    approvedByName?: string;
    approvedAt?: string | Date | null;
    approvalStampId?: string;
  };
};

function dateLabel(value: string | Date) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export async function createInvoicePdf(input: InvoicePdfInput) {
  const { invoice } = input;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const deep = rgb(3 / 255, 54 / 255, 61 / 255);
  const soft = rgb(189 / 255, 217 / 255, 215 / 255);
  const ink = rgb(0.12, 0.16, 0.18);

  page.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: deep });
  page.drawText("IFTA CONSULTING", { x: 42, y: 795, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText("CONSULTANCY INVOICE", { x: 42, y: 768, size: 11, font: regular, color: soft });
  page.drawText(invoice.invoiceNumber, { x: 400, y: 790, size: 13, font: bold, color: rgb(1, 1, 1) });

  const rows = [
    ["Client", input.clientName],
    ["Engagement", input.engagementReference],
    ["Service", input.serviceName],
    ["Issue date", dateLabel(invoice.issueDate)],
    ["Due date", dateLabel(invoice.dueDate)],
    ["Status", invoice.status.replaceAll("_", " ").toUpperCase()],
  ];
  let y = 690;
  for (const [label, value] of rows) {
    page.drawText(label, { x: 42, y, size: 10, font: bold, color: deep });
    page.drawText(String(value).slice(0, 72), { x: 160, y, size: 10, font: regular, color: ink });
    y -= 32;
  }

  page.drawRectangle({ x: 42, y: y - 35, width: 511, height: 70, color: soft });
  page.drawText("AMOUNT DUE", { x: 62, y: y + 5, size: 11, font: bold, color: deep });
  page.drawText(`${invoice.currency} ${invoice.amount.toLocaleString("en-KE")}`, { x: 340, y: y - 1, size: 20, font: bold, color: deep });
  if (invoice.notes) page.drawText(invoice.notes.slice(0, 90), { x: 42, y: y - 75, size: 10, font: regular, color: rgb(0.25, 0.3, 0.32) });

  if (invoice.approvedAt && invoice.approvedByName && invoice.approvalStampId) {
    page.drawRectangle({ x: 320, y: 210, width: 233, height: 104, color: rgb(0.95, 0.98, 0.98), borderColor: deep, borderWidth: 1.5 });
    page.drawText("DIGITALLY APPROVED", { x: 338, y: 286, size: 12, font: bold, color: deep });
    page.drawText(`Administrator: ${invoice.approvedByName}`.slice(0, 47), { x: 338, y: 264, size: 8.5, font: regular, color: ink });
    page.drawText(`Approved: ${dateLabel(invoice.approvedAt)}`, { x: 338, y: 246, size: 8.5, font: regular, color: ink });
    page.drawText(`Stamp: ${invoice.approvalStampId}`.slice(0, 48), { x: 338, y: 228, size: 7.5, font: regular, color: deep });
  }

  page.drawText("Thank you for choosing IFTA Consulting.", { x: 42, y: 55, size: 10, font: regular, color: deep });
  return Buffer.from(await pdf.save());
}
