import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/server";
import {
  canAccessStaffRoute,
  getPrimaryStaffRole,
  type StaffRouteKey,
} from "@/features/staff/workspace";

export async function requireStaffWorkspace() {
  const principal = await requireUser();
  const role = getPrimaryStaffRole(principal.roleKeys);

  if (!role) {
    redirect(principal.roleKeys.some((key) => key === "admin" || key === "super_admin")
      ? "/admin/dashboard"
      : "/client");
  }

  return { principal, role };
}

export async function requireStaffRoute(route: StaffRouteKey) {
  const context = await requireStaffWorkspace();

  if (!canAccessStaffRoute(context.principal.roleKeys, route)) {
    redirect("/staff?access=restricted");
  }

  return context;
}
