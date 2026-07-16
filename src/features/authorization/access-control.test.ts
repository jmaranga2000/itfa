import { describe, expect, it } from "vitest";
import {
  assertClientOrganizationAccess,
  assertDocumentAccess,
  assertEngagementAccess,
  assertPermission,
  type Principal,
} from "@/features/authorization/access-control";

const basePrincipal: Principal = {
  id: "user_1",
  email: "client@example.com",
  roleKeys: ["client"],
  permissions: ["engagements.create", "documents.read_assigned"],
  clientOrganizationIds: ["org_1"],
  assignedEngagementIds: ["eng_1"],
};

describe("access-control", () => {
  it("denies missing permissions", () => {
    expect(() => assertPermission(basePrincipal, "settings.manage")).toThrow(
      "Missing required permission",
    );
  });

  it("allows scoped organization access", () => {
    expect(() => assertClientOrganizationAccess(basePrincipal, "org_1")).not.toThrow();
    expect(() => assertClientOrganizationAccess(basePrincipal, "org_2")).toThrow(
      "outside your access scope",
    );
  });

  it("allows scoped engagement access", () => {
    expect(() => assertEngagementAccess(basePrincipal, "eng_1")).not.toThrow();
    expect(() => assertEngagementAccess(basePrincipal, "eng_2")).toThrow(
      "outside your access scope",
    );
  });

  it("prevents clients from reading staff-only documents without a document permission", () => {
    expect(() =>
      assertDocumentAccess(
        {
          ...basePrincipal,
          permissions: ["engagements.create"],
        },
        {
          visibility: "staff_only",
          engagementId: "eng_1",
        },
      ),
    ).toThrow("required permissions");
  });
});
