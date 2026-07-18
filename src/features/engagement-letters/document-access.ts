import type { Principal } from "@/features/authorization/access-control";
import {
  getAdminEngagementLetter,
  getClientEngagementLetter,
} from "@/repositories/engagement-letter-repository";

export async function getEngagementLetterDocumentForPrincipal(principal: Principal, letterId: string) {
  const isAdministrator = principal.roleKeys.some((role) => role === "admin" || role === "super_admin");
  if (isAdministrator) return getAdminEngagementLetter(letterId);
  if (principal.roleKeys.some((role) => role === "client" || role === "client_representative")) {
    return getClientEngagementLetter(letterId, principal.id);
  }
  return null;
}
