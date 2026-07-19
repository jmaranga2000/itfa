import type { Principal } from "@/features/authorization/access-control";
import { sendClientJourneyEmail } from "@/features/engagements/client-journey-email";
import { UserModel } from "@/models/user";
import { createCommunicationNotification } from "@/repositories/communication-repository";
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
    const clientSigner = letter.signers
      .filter((signer) => signer.role === "client" && signer.status === "signed")
      .sort((left, right) => (right.signedAt ?? "").localeCompare(left.signedAt ?? ""))[0];
    const signedAt = clientSigner?.signedAt ?? letter.completedAt;
    if (!signedAt) return { activated: false as const, workflowId: null };

    const workflowId = await convertEngagementRequestToWorkflow(letter.requestId, actor, {
      engagementLetterId: letter.id,
      letterGeneratedAt: letter.generatedAt,
      letterSentAt: letter.sentAt,
      signedAt,
      signerUserId: clientSigner?.signedByUserId ?? letter.clientUserId,
      signerName: clientSigner?.name || letter.clientName,
    });
    if (!workflowId) return { activated: false as const, workflowId: null };
    await linkEngagementLetterToWorkflow(letter.requestId, workflowId);

    const administrators = await UserModel.find({
      status: "active",
      archivedAt: null,
      roleKeys: { $in: ["super_admin", "admin", "engagement_manager"] },
    }).select("_id").lean().exec();
    await Promise.allSettled([
      sendClientJourneyEmail({
        recipientEmail: letter.clientEmail,
        recipientName: letter.clientName,
        title: "Your IFTA engagement is now active",
        summary: `${letter.requestReference} has completed onboarding. Your engagement workspace is ready and the administrator is assigning your delivery team.`,
        actionLabel: "Open engagement",
        actionPath: "/client/engagements",
      }),
      ...administrators.map((administrator) => createCommunicationNotification({
        recipientUserId: administrator._id.toString(),
        type: "new_engagement",
        title: "Engagement activated",
        description: `${letter.clientName} signed ${letter.reference}. Assign the engagement team next.`,
        relatedModule: "engagements",
        relatedRecordId: workflowId,
        actionUrl: `/admin/active-engagements/${workflowId}`,
        createdByUserId: actor.id,
      })),
    ]);
    return { activated: true as const, workflowId };
  } catch (error) {
    console.error("Unable to activate completed engagement letter.", error);
    return { activated: false as const, workflowId: null };
  }
}
