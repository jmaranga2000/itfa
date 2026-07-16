import { redirect } from "next/navigation";
import {
  assertAnyPermission,
  assertPermission,
  assertRole,
  type Principal,
} from "@/features/authorization/access-control";
import type { Permission } from "@/features/authorization/permissions";
import type { AppRole } from "@/features/authorization/roles";
import { getCurrentSessionPrincipal } from "@/features/auth/session";

export async function getCurrentUser(): Promise<Principal | null> {
  return getCurrentSessionPrincipal();
}

export async function requireUser(): Promise<Principal> {
  const principal = await getCurrentSessionPrincipal();

  if (!principal) {
    redirect("/sign-in");
  }

  return principal;
}

export async function requirePermission(permission: Permission) {
  const principal = await requireUser();
  assertPermission(principal, permission);
  return principal;
}

export async function requireAnyPermission(permissions: readonly Permission[]) {
  const principal = await requireUser();
  assertAnyPermission(principal, permissions);
  return principal;
}

export async function requireRole(role: AppRole) {
  const principal = await requireUser();
  assertRole(principal, role);
  return principal;
}
