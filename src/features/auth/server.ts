import { redirect } from "next/navigation";
import {
  hasAnyPermission,
  hasPermission,
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
  if (!hasPermission(principal, permission)) redirect("/access-blocked");
  return principal;
}

export async function requireAnyPermission(permissions: readonly Permission[]) {
  const principal = await requireUser();
  if (!hasAnyPermission(principal, permissions)) redirect("/access-blocked");
  return principal;
}

export async function requireRole(role: AppRole) {
  const principal = await requireUser();
  if (!principal.roleKeys.includes(role)) redirect("/access-blocked");
  return principal;
}

export async function requireAnyRole(roles: readonly AppRole[]) {
  const principal = await requireUser();
  if (!roles.some((role) => principal.roleKeys.includes(role))) redirect("/access-blocked");
  return principal;
}
