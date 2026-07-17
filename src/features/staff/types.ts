import type { AppRole } from "@/features/authorization/roles";

export const STAFF_ACCOUNT_ROLES = [
  "engagement_manager",
  "consultant",
  "reviewer",
  "finance_officer",
  "document_controller",
  "support_staff",
  "auditor",
] as const satisfies readonly AppRole[];

export type StaffAccountRole = (typeof STAFF_ACCOUNT_ROLES)[number];

export const STAFF_ACCOUNT_STATUSES = ["active", "suspended"] as const;
export type StaffAccountStatus = (typeof STAFF_ACCOUNT_STATUSES)[number];
