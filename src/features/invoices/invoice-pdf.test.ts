import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { createInvoicePdf } from "@/features/invoices/invoice-pdf";

describe("createInvoicePdf", () => {
  it("creates a valid digitally approved invoice", async () => {
    const bytes = await createInvoicePdf({
      clientName: "Example Client",
      engagementReference: "ENG-2026-001",
      serviceName: "Tax advisory",
      company: {
        companyName: "IFTA Consulting",
        legalName: "IFTA Consulting Limited",
        registrationNumber: "CPR/2026/001",
        kraPin: "P000000000A",
        address: "Nairobi, Kenya",
        email: "office@ifta.example",
        phone: "+254 700 000 000",
        website: "https://ifta.example",
        approverTitle: "Managing Director",
        timezone: "Africa/Nairobi",
      },
      invoice: {
        invoiceNumber: "INV-2026-001",
        issueDate: "2026-07-26T08:00:00.000Z",
        dueDate: "2026-08-09T08:00:00.000Z",
        amount: 125000,
        currency: "KES",
        status: "issued",
        notes: "Professional fees",
        approvedByName: "IFTA Administrator",
        approvedAt: "2026-07-26T09:00:00.000Z",
        approvalStampId: "IFTA-2026-0123456789ABCDEF",
      },
    });

    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(1);
  });
});
