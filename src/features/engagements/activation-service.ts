import type { Principal } from "@/features/authorization/access-control";
import { sendClientJourneyEmail } from "@/features/engagements/client-journey-email";
import {
  getAdminEngagementLetter,
  linkEngagementLetterToWorkflow,
} from "@/repositories/engagement-letter-repository";
import { convertEngagementRequestToWorkflow } from "@/repositories/engagement-request-repository";

export async function activateCompletedEngagementLetter(letterId: string, actor: Principal) {
  const letter = await getAdminEngagementLetter(letterId);
  if (!letter || letter.status !== "completed") {
    return { activated: false as const, workflowId: letter?.workflowId ?? null };
  }
  if (letter.workflowId) {
    return { activated: false as const, workflowId: letter.workflowId };
  }

  try {
    const workflowId = await convertEngagementRequestToWorkflow(letter.requestId, actor);
    if (!workflowId) return { activated: false as const, workflowId: null };
    await linkEngagementLetterToWorkflow(letter.requestId, workflowId);
    await sendClientJourneyEmail({
      recipientEmail: letter.clientEmail,
      recipientName: letter.clientName,
      title: "Your IFTA engagement is now active",
      summary: `${letter.requestReference} has completed onboarding. Your engagement workspace is ready and the assigned team can begin delivery work.`,
      actionLabel: "Open engagement",
      actionPath: "/client/engagements",
    });
    return { activated: true as const, workflowId };
  } catch (error) {
    console.error("Unable to activate completed engagement letter.", error);
    return { activated: false as const, workflowId: null };
  }
}
