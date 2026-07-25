import type { Principal } from "@/features/authorization/access-control";
import {
  getAdminEngagementLetter,
  getClientEngagementLetter,
} from "@/repositories/engagement-letter-repository";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

export async function getEngagementLetterDocumentForPrincipal(principal: Principal, letterId: string) {
  const isAdministrator = principal.roleKeys.some((role) => role === "admin" || role === "super_admin");
  if (isAdministrator) return getAdminEngagementLetter(letterId);
  if (principal.roleKeys.some((role) => role === "client" || role === "client_representative")) {
    return getClientEngagementLetter(letterId, principal.id);
  }

  const letter = await getAdminEngagementLetter(letterId);
  if (!letter?.workflowId) return null;
  const workflow = await getWorkflowForPrincipal(principal, letter.workflowId, true);
  if (!workflow) return null;
  const assigned = workflow.responsibleUserId === principal.id
    || workflow.team.some((member) => member.userId === principal.id)
    || workflow.tasks.some((task) => task.assignedUserId === principal.id);
  return assigned ? letter : null;
}