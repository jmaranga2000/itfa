import { AuthorizationError } from "@/lib/errors";
import type { Permission } from "@/features/authorization/permissions";
import type { AppRole } from "@/features/authorization/roles";

export type Principal = {
  id: string;
  email: string;
  displayName?: string;
  roleKeys: AppRole[];
  permissions: Permission[];
  clientOrganizationIds: string[];
  assignedEngagementIds: string[];
  readOnly?: boolean;
};

export function hasPermission(principal: Principal, permission: Permission) {
  return principal.permissions.includes(permission);
}

export function hasAnyPermission(principal: Principal, permissions: readonly Permission[]) {
  return permissions.some((permission) => hasPermission(principal, permission));
}

export function assertPermission(principal: Principal, permission: Permission) {
  if (!hasPermission(principal, permission)) {
    throw new AuthorizationError(`Missing required permission: ${permission}`);
  }
}

export function assertAnyPermission(principal: Principal, permissions: readonly Permission[]) {
  if (!hasAnyPermission(principal, permissions)) {
    throw new AuthorizationError(
      `Missing one of the required permissions: ${permissions.join(", ")}`,
    );
  }
}

export function assertRole(principal: Principal, role: AppRole) {
  if (!principal.roleKeys.includes(role)) {
    throw new AuthorizationError(`Missing required role: ${role}`);
  }
}

export function canAccessClientOrganization(principal: Principal, organizationId: string) {
  return (
    hasPermission(principal, "clients.read") ||
    principal.clientOrganizationIds.includes(organizationId)
  );
}

export function canAccessAssignedEngagement(principal: Principal, engagementId: string) {
  return (
    hasPermission(principal, "engagements.read_all") ||
    principal.assignedEngagementIds.includes(engagementId)
  );
}

export function assertClientOrganizationAccess(principal: Principal, organizationId: string) {
  if (!canAccessClientOrganization(principal, organizationId)) {
    throw new AuthorizationError("This client organization is outside your access scope.");
  }
}

export function assertEngagementAccess(principal: Principal, engagementId: string) {
  if (!canAccessAssignedEngagement(principal, engagementId)) {
    throw new AuthorizationError("This engagement is outside your access scope.");
  }
}

export function assertDocumentAccess(
  principal: Principal,
  document: {
    visibility: "client_and_assigned_staff" | "staff_only" | "finance_only" | "admin_only";
    organizationId?: string;
    engagementId?: string;
  },
) {
  if (document.visibility === "admin_only") {
    assertPermission(principal, "documents.read_all");
    return;
  }

  if (document.visibility === "finance_only") {
    assertAnyPermission(principal, ["invoices.read", "documents.read_all"]);
    return;
  }

  if (document.visibility === "staff_only") {
    assertAnyPermission(principal, ["documents.read_assigned", "documents.read_all"]);
    if (document.engagementId) {
      assertEngagementAccess(principal, document.engagementId);
    }
    return;
  }

  if (document.organizationId) {
    assertClientOrganizationAccess(principal, document.organizationId);
  }

  if (document.engagementId) {
    assertEngagementAccess(principal, document.engagementId);
  }
}
