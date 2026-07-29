import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { AdjustmentNoteDocument } from "@/models/adjustment-note";
import type { FiscalInvoiceDocument } from "@/models/fiscal-invoice";

type Company = {
  legalName: string;
  tradingName: string;
  registrationNumber: string;
  kraPin: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
};

function money(value: number, currency: string) {
  return `${currency} ${value.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fit(text: string, max = 76) {
  return text.length <= max ? text : `${text.slice(0, Math.max(1, max - 3))}...`;
}

export async function createFiscalInvoicePdf(input: {
  invoice: FiscalInvoiceDocument;
  company: Company;
}) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const teal = rgb(0.012, 0.212, 0.239);
  const mint = rgb(0.741, 0.851, 0.843);
  const ink = rgb(0.08, 0.12, 0.14);
  const muted = rgb(0.36, 0.42, 0.44);
  let y = 790;

  const line = (text: string, size = 9, weight: "regular" | "bold" = "regular", color = ink) => {
    page.drawText(fit(text), { x: 42, y, size, font: weight === "bold" ? bold : regular, color });
    y -= size + 6;
  };
  const ensureSpace = (height: number) => {
    if (y - height > 48) return;
    page = pdf.addPage([595, 842]);
    y = 790;
  };

  page.drawRectangle({ x: 0, y: 740, width: 595, height: 102, color: teal });
  page.drawText(input.company.tradingName || input.company.legalName || "IFTA Consulting", {
    x: 42,
    y: 798,
    size: 21,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("KRA eTIMS FISCAL INVOICE", {
    x: 42,
    y: 768,
    size: 11,
    font: bold,
    color: mint,
  });
  page.drawText(input.invoice.invoiceNumber, {
    x: 405,
    y: 788,
    size: 12,
    font: bold,
    color: rgb(1, 1, 1),
  });
  y = 712;
  line(`Client: ${input.invoice.clientName}`, 11, "bold");
  line(`Email: ${input.invoice.clientEmail}`, 9, "regular", muted);
  if (input.invoice.clientKraPin) line(`Client KRA PIN: ${input.invoice.clientKraPin}`, 9, "regular", muted);
  line(`Engagement: ${input.invoice.engagementReference} | ${input.invoice.serviceName}`, 9, "regular", muted);
  line(`Invoice date: ${new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(input.invoice.issueDate)}`);
  line(`Due date: ${new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(input.invoice.dueDate)}`);
  y -= 8;

  page.drawRectangle({ x: 42, y: y - 4, width: 511, height: 24, color: mint });
  page.drawText("DESCRIPTION", { x: 50, y: y + 4, size: 8, font: bold, color: teal });
  page.drawText("QTY", { x: 350, y: y + 4, size: 8, font: bold, color: teal });
  page.drawText("TAX", { x: 402, y: y + 4, size: 8, font: bold, color: teal });
  page.drawText("TOTAL", { x: 480, y: y + 4, size: 8, font: bold, color: teal });
  y -= 22;
  for (const item of input.invoice.lines) {
    ensureSpace(35);
    page.drawText(fit(item.description, 48), { x: 50, y, size: 8, font: regular, color: ink });
    page.drawText(String(item.quantity), { x: 350, y, size: 8, font: regular, color: ink });
    page.drawText(`${item.taxRate}%`, { x: 402, y, size: 8, font: regular, color: ink });
    page.drawText(money(item.totalAmount, input.invoice.currency), { x: 460, y, size: 8, font: regular, color: ink });
    y -= 19;
  }
  y -= 8;
  line(`Subtotal: ${money(input.invoice.subtotal, input.invoice.currency)}`, 10, "bold");
  line(`Tax: ${money(input.invoice.taxAmount, input.invoice.currency)}`, 10, "bold");
  line(`Total: ${money(input.invoice.totalAmount, input.invoice.currency)}`, 13, "bold", teal);
  y -= 10;
  line(`KRA invoice reference: ${input.invoice.etims.kraInvoiceNumber}`, 9, "bold");
  if (input.invoice.etims.receiptNumber) line(`Receipt number: ${input.invoice.etims.receiptNumber}`);
  if (input.invoice.etims.controlUnitId) line(`Control unit: ${input.invoice.etims.controlUnitId}`);
  if (input.invoice.etims.qrData) {
    line("eTIMS verification data", 9, "bold", teal);
    line(input.invoice.etims.qrData, 7, "regular", muted);
  }
  y -= 8;
  line(`${input.company.legalName} | KRA PIN ${input.company.kraPin || "Not configured"}`, 8, "bold");
  line([
    input.company.address,
    input.company.city,
    input.company.country,
    input.company.phone,
    input.company.email,
  ].filter(Boolean).join(" | "), 7, "regular", muted);

  return pdf.save();
}

export async function createAdjustmentNotePdf(input: {
  note: AdjustmentNoteDocument;
  company: Company;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const teal = rgb(0.012, 0.212, 0.239);
  const mint = rgb(0.741, 0.851, 0.843);
  const ink = rgb(0.08, 0.12, 0.14);
  const label = input.note.type === "CREDIT_NOTE" ? "CREDIT NOTE" : "DEBIT NOTE";
  const effect = input.note.type === "CREDIT_NOTE" ? "Reduction" : "Increase";
  let y = 790;
  page.drawRectangle({ x: 0, y: 740, width: 595, height: 102, color: teal });
  page.drawText(input.company.tradingName || input.company.legalName || "IFTA Consulting", {
    x: 42,
    y: 798,
    size: 21,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(`KRA eTIMS FISCAL ${label}`, { x: 42, y: 768, size: 11, font: bold, color: mint });
  page.drawText(input.note.noteNumber, { x: 430, y: 788, size: 12, font: bold, color: rgb(1, 1, 1) });
  y = 710;
  const draw = (text: string, size = 9, weight: "regular" | "bold" = "regular") => {
    page.drawText(fit(text), { x: 42, y, size, font: weight === "bold" ? bold : regular, color: ink });
    y -= size + 7;
  };
  draw(`Client: ${input.note.clientName}`, 11, "bold");
  draw(`Original invoice: ${input.note.originalInternalInvoiceNumber}`);
  draw(`Original KRA reference: ${input.note.originalEtimsInvoiceNumber}`);
  draw(`Reason: ${input.note.reasonDescription}`);
  draw(`${effect}: ${money(input.note.totalAmount, input.note.currency)}`, 12, "bold");
  draw(`Revised invoice position: ${money(input.note.adjustedInvoiceNetTotal, input.note.currency)}`, 11, "bold");
  y -= 8;
  page.drawRectangle({ x: 42, y: y - 4, width: 511, height: 24, color: mint });
  page.drawText("DESCRIPTION", { x: 50, y: y + 4, size: 8, font: bold, color: teal });
  page.drawText("QTY", { x: 350, y: y + 4, size: 8, font: bold, color: teal });
  page.drawText("TAX", { x: 402, y: y + 4, size: 8, font: bold, color: teal });
  page.drawText("TOTAL", { x: 480, y: y + 4, size: 8, font: bold, color: teal });
  y -= 22;
  for (const item of input.note.lines) {
    page.drawText(fit(item.description, 48), { x: 50, y, size: 8, font: regular, color: ink });
    page.drawText(String(item.adjustmentQuantity), { x: 350, y, size: 8, font: regular, color: ink });
    page.drawText(`${item.taxRate}%`, { x: 402, y, size: 8, font: regular, color: ink });
    page.drawText(money(item.totalAmount, input.note.currency), { x: 460, y, size: 8, font: regular, color: ink });
    y -= 19;
  }
  y -= 12;
  const etims = input.note.etims;
  draw(`KRA note reference: ${etims?.kraInvoiceNumber ?? "Pending"}`, 9, "bold");
  if (etims?.receiptNumber) draw(`Receipt number: ${etims.receiptNumber}`);
  if (etims?.controlUnitId) draw(`Control unit: ${etims.controlUnitId}`);
  if (etims?.qrData) draw(`Verification: ${etims.qrData}`, 7);
  y -= 10;
  draw(`${input.company.legalName} | KRA PIN ${input.company.kraPin || "Not configured"}`, 8, "bold");
  draw([input.company.address, input.company.city, input.company.country, input.company.email]
    .filter(Boolean).join(" | "), 7);
  return pdf.save();
}
