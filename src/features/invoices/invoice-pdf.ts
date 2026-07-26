import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";

export type InvoiceCompanyDetails = {
  companyName: string;
  legalName: string;
  registrationNumber: string;
  kraPin: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  approverTitle: string;
  timezone?: string;
};

export type InvoicePdfInput = {
  clientName: string;
  engagementReference: string;
  serviceName: string;
  company: InvoiceCompanyDetails;
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

function dateTimeLabel(value: string | Date, timezone = "Africa/Nairobi") {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(new Date(value));
}

function fittedSize(text: string, font: PDFFont, preferredSize: number, maxWidth: number, minimumSize = 6) {
  let size = preferredSize;
  while (size > minimumSize && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return size;
}

function drawFittedText(input: {
  page: PDFPage;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  preferredSize: number;
  font: PDFFont;
  color: RGB;
}) {
  const text = input.text.trim();
  if (!text) return;
  const size = fittedSize(text, input.font, input.preferredSize, input.maxWidth);
  input.page.drawText(text, { x: input.x, y: input.y, size, font: input.font, color: input.color });
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "IFTA";
}

function drawApprovalStamp(input: {
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  deep: RGB;
  soft: RGB;
  ink: RGB;
  company: InvoiceCompanyDetails;
  approvedByName: string;
  approvedAt: string | Date;
  approvalStampId: string;
}) {
  const { page, regular, bold, deep, soft, ink, company } = input;
  const x = 254;
  const y = 170;
  const width = 299;
  const height = 164;

  page.drawRectangle({ x, y, width, height, color: rgb(0.975, 0.99, 0.989), borderColor: deep, borderWidth: 1.5 });
  page.drawRectangle({ x: x + 6, y: y + 6, width: width - 12, height: height - 12, borderColor: soft, borderWidth: 1 });

  const sealX = x + 61;
  const sealY = y + 90;
  page.drawCircle({ x: sealX, y: sealY, size: 47, borderColor: deep, borderWidth: 2 });
  page.drawCircle({ x: sealX, y: sealY, size: 39, borderColor: deep, borderWidth: 0.8 });
  const sealInitials = initials(company.companyName);
  const initialsSize = fittedSize(sealInitials, bold, 17, 64, 10);
  page.drawText(sealInitials, {
    x: sealX - bold.widthOfTextAtSize(sealInitials, initialsSize) / 2,
    y: sealY + 12,
    size: initialsSize,
    font: bold,
    color: deep,
  });
  page.drawText("APPROVED", {
    x: sealX - bold.widthOfTextAtSize("APPROVED", 9) / 2,
    y: sealY - 5,
    size: 9,
    font: bold,
    color: deep,
  });
  const sealDate = dateLabel(input.approvedAt).toUpperCase();
  page.drawText(sealDate, {
    x: sealX - regular.widthOfTextAtSize(sealDate, 6.5) / 2,
    y: sealY - 20,
    size: 6.5,
    font: regular,
    color: deep,
  });

  const detailsX = x + 121;
  const detailsWidth = width - 137;
  drawFittedText({ page, text: "OFFICIAL DIGITAL STAMP", x: detailsX, y: y + 137, maxWidth: detailsWidth, preferredSize: 10.5, font: bold, color: deep });
  drawFittedText({ page, text: company.companyName, x: detailsX, y: y + 119, maxWidth: detailsWidth, preferredSize: 9, font: bold, color: ink });
  drawFittedText({ page, text: `Approved by: ${input.approvedByName}`, x: detailsX, y: y + 101, maxWidth: detailsWidth, preferredSize: 7.5, font: regular, color: ink });
  drawFittedText({ page, text: `Role: ${company.approverTitle || "Authorized Signatory"}`, x: detailsX, y: y + 86, maxWidth: detailsWidth, preferredSize: 7.5, font: regular, color: ink });
  drawFittedText({ page, text: `Time: ${dateTimeLabel(input.approvedAt, company.timezone)}`, x: detailsX, y: y + 71, maxWidth: detailsWidth, preferredSize: 7.2, font: regular, color: ink });
  if (company.registrationNumber) drawFittedText({ page, text: `Registration: ${company.registrationNumber}`, x: detailsX, y: y + 56, maxWidth: detailsWidth, preferredSize: 7.2, font: regular, color: ink });
  if (company.kraPin) drawFittedText({ page, text: `KRA PIN: ${company.kraPin}`, x: detailsX, y: y + 41, maxWidth: detailsWidth, preferredSize: 7.2, font: regular, color: ink });
  drawFittedText({ page, text: `Verification: ${input.approvalStampId}`, x: detailsX, y: y + 22, maxWidth: detailsWidth, preferredSize: 6.5, font: bold, color: deep });
}

export async function createInvoicePdf(input: InvoicePdfInput) {
  const { invoice, company } = input;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const deep = rgb(3 / 255, 54 / 255, 61 / 255);
  const soft = rgb(189 / 255, 217 / 255, 215 / 255);
  const ink = rgb(0.12, 0.16, 0.18);

  page.drawRectangle({ x: 0, y: 724, width: 595, height: 118, color: deep });
  drawFittedText({ page, text: company.companyName || "IFTA Consulting", x: 42, y: 798, maxWidth: 330, preferredSize: 20, font: bold, color: rgb(1, 1, 1) });
  if (company.legalName && company.legalName !== company.companyName) {
    drawFittedText({ page, text: company.legalName, x: 42, y: 781, maxWidth: 330, preferredSize: 8, font: regular, color: soft });
  }
  page.drawText("CONSULTANCY INVOICE", { x: 42, y: 754, size: 10.5, font: regular, color: soft });
  drawFittedText({ page, text: invoice.invoiceNumber, x: 390, y: 795, maxWidth: 163, preferredSize: 13, font: bold, color: rgb(1, 1, 1) });
  const companyContact = [company.email, company.phone, company.website].filter(Boolean).join("  |  ");
  drawFittedText({ page, text: companyContact, x: 42, y: 737, maxWidth: 511, preferredSize: 7.5, font: regular, color: rgb(1, 1, 1) });

  const rows = [
    ["Client", input.clientName],
    ["Engagement", input.engagementReference],
    ["Service", input.serviceName],
    ["Issue date", dateLabel(invoice.issueDate)],
    ["Due date", dateLabel(invoice.dueDate)],
    ["Status", invoice.status.replaceAll("_", " ").toUpperCase()],
  ];
  let rowY = 687;
  for (const [label, value] of rows) {
    page.drawText(label, { x: 42, y: rowY, size: 10, font: bold, color: deep });
    drawFittedText({ page, text: String(value), x: 160, y: rowY, maxWidth: 393, preferredSize: 10, font: regular, color: ink });
    page.drawLine({ start: { x: 42, y: rowY - 11 }, end: { x: 553, y: rowY - 11 }, color: rgb(0.9, 0.93, 0.93), thickness: 0.5 });
    rowY -= 32;
  }

  page.drawRectangle({ x: 42, y: rowY - 35, width: 511, height: 70, color: soft });
  page.drawText("AMOUNT DUE", { x: 62, y: rowY + 5, size: 11, font: bold, color: deep });
  drawFittedText({ page, text: `${invoice.currency} ${invoice.amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, x: 330, y: rowY - 1, maxWidth: 203, preferredSize: 20, font: bold, color: deep });
  if (invoice.notes) drawFittedText({ page, text: `Notes: ${invoice.notes}`, x: 42, y: rowY - 74, maxWidth: 511, preferredSize: 9, font: regular, color: rgb(0.25, 0.3, 0.32) });

  if (invoice.approvedAt && invoice.approvedByName && invoice.approvalStampId) {
    drawApprovalStamp({
      page,
      regular,
      bold,
      deep,
      soft,
      ink,
      company,
      approvedByName: invoice.approvedByName,
      approvedAt: invoice.approvedAt,
      approvalStampId: invoice.approvalStampId,
    });
  }

  const address = [company.address].filter(Boolean).join(", ");
  drawFittedText({ page, text: address, x: 42, y: 78, maxWidth: 511, preferredSize: 8, font: regular, color: ink });
  page.drawText(`Thank you for choosing ${company.companyName || "IFTA Consulting"}.`, { x: 42, y: 55, size: 10, font: regular, color: deep });
  if (invoice.approvalStampId) {
    drawFittedText({ page, text: `Digital approval reference: ${invoice.approvalStampId}`, x: 300, y: 55, maxWidth: 253, preferredSize: 7, font: regular, color: deep });
  }
  return Buffer.from(await pdf.save());
}