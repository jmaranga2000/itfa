import { describe, expect, it } from "vitest";
import {
  isClientVisibleNoteStatus,
  isClientVisibleInvoiceStatus,
} from "@/features/etims/types";
import { deterministicPayloadHash } from "@/repositories/fiscal-invoice-repository";

describe("eTIMS fiscal visibility", () => {
  it("shows only accepted or delivered invoice lifecycle states", () => {
    expect(isClientVisibleInvoiceStatus("DELIVERY_QUEUED")).toBe(true);
    expect(isClientVisibleInvoiceStatus("DELIVERED")).toBe(true);
    expect(isClientVisibleInvoiceStatus("PENDING_ADMIN_APPROVAL")).toBe(false);
    expect(isClientVisibleInvoiceStatus("ETIMS_REJECTED")).toBe(false);
    expect(isClientVisibleInvoiceStatus("ETIMS_RECONCILIATION_REQUIRED")).toBe(false);
  });

  it("never exposes draft or rejected adjustment notes", () => {
    expect(isClientVisibleNoteStatus("DELIVERY_QUEUED")).toBe(true);
    expect(isClientVisibleNoteStatus("DELIVERED")).toBe(true);
    expect(isClientVisibleNoteStatus("DRAFT")).toBe(false);
    expect(isClientVisibleNoteStatus("ETIMS_REJECTED")).toBe(false);
  });
});

describe("immutable fiscal payload hashing", () => {
  it("produces the same hash regardless of object key order", () => {
    const first = deterministicPayloadHash({
      invoiceNumber: "INV-001",
      totals: { tax: 160, gross: 1_160 },
      lines: [{ description: "Tax advisory", quantity: 1 }],
    });
    const second = deterministicPayloadHash({
      lines: [{ quantity: 1, description: "Tax advisory" }],
      totals: { gross: 1_160, tax: 160 },
      invoiceNumber: "INV-001",
    });
    expect(first).toBe(second);
  });

  it("changes when a fiscal amount changes", () => {
    const first = deterministicPayloadHash({ invoiceNumber: "INV-001", gross: 1_160 });
    const second = deterministicPayloadHash({ invoiceNumber: "INV-001", gross: 1_161 });
    expect(first).not.toBe(second);
  });
});
