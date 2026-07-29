import { describe, expect, it } from "vitest";
import { ROLE_PERMISSION_MATRIX } from "@/features/authorization/roles";

describe("eTIMS maker-checker permissions", () => {
  it("allows Finance to prepare and submit but not approve", () => {
    expect(ROLE_PERMISSION_MATRIX.finance_officer).toContain("invoice.create");
    expect(ROLE_PERMISSION_MATRIX.finance_officer).toContain("invoice.submit_for_approval");
    expect(ROLE_PERMISSION_MATRIX.finance_officer).not.toContain("invoice.approve");
    expect(ROLE_PERMISSION_MATRIX.finance_officer).not.toContain("adjustment_note.confirm");
  });

  it("allows Admin to approve, reconcile, and confirm adjustments", () => {
    expect(ROLE_PERMISSION_MATRIX.admin).toContain("invoice.approve");
    expect(ROLE_PERMISSION_MATRIX.admin).toContain("etims.transaction.reconcile");
    expect(ROLE_PERMISSION_MATRIX.admin).toContain("adjustment_note.confirm");
    expect(ROLE_PERMISSION_MATRIX.admin).toContain("finance_delivery.retry");
  });

  it("keeps Auditor read-only", () => {
    expect(ROLE_PERMISSION_MATRIX.auditor).toContain("etims.transaction.read");
    expect(ROLE_PERMISSION_MATRIX.auditor).not.toContain("invoice.approve");
    expect(ROLE_PERMISSION_MATRIX.auditor).not.toContain("etims.transaction.retry");
  });
});
